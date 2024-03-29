import { z } from "zod";

import { createTRPCRouter, isEvaluator, protectedProcedure, t } from "../trpc";
import { ApplicationStatus } from "@prisma/client";

export const applicationSubmissionRouter = createTRPCRouter({
  upsertApplicationSubmission: protectedProcedure
    .input(
      z.object({
        applicationSubmissionId: z.string().optional(),
        applicationId: z.string(),
        status: z.enum(["NEW", "SUBMITTED", "DRAFT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { applicationSubmissionId, applicationId, status } = input;
      const userId = ctx.user.userId;

      const applicationSubmission =
        await ctx.prisma.applicationSubmission.upsert({
          where: {
            id: applicationSubmissionId || "",
          },
          create: {
            userId,
            applicationId,
            applicationSubmissionStatus: status,
          },
          update: {
            applicationSubmissionStatus: status,
            updatedAt: new Date(),
          },
          include: {
            applicationSubmissionAnswers: true,
            application: true,
          },
        });

      return applicationSubmission;
    }),
  getApplicationSubmissionsForUser: protectedProcedure.query(
    async ({ ctx }) => {
      const userId = ctx.user.userId;

      const applicationSubmissions = await ctx.prisma.applicationSubmission.findMany({
        where: {
          userId,
        },
        include: {
          application: {
            include: {
              questions: {
                orderBy: {
                  orderNumber: "asc",
                },
              },
            },
          },
          applicationSubmissionAnswers: true,
        },
      });

      applicationSubmissions.forEach(async (applicationSubmission) => {
        const application = applicationSubmission.application;
        if (application.deadline && application.deadline < new Date()) {
          await ctx.prisma.application.update({
            where: {
              id: application.id,
            },
            data: {
              status: ApplicationStatus.CLOSED
            }
          })
        }
      })

      return applicationSubmissions;
    },
  ),
  getApplicationSubmissionByApplicationId: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { applicationId } = input;

      const userId = ctx.user.userId;

      const applicationSubmission =
        await ctx.prisma.applicationSubmission.findFirst({
          where: {
            applicationId,
            userId,
          },
          include: {
            applicationSubmissionAnswers: true,
            application: true,
          },
        });

      if (applicationSubmission) {
        const application = applicationSubmission.application;
        if (application.deadline && application.deadline < new Date()) {
          await ctx.prisma.application.update({
            where: {
              id: application.id,
            },
            data: {
              status: ApplicationStatus.CLOSED
            }
          })
        }
      }

      return applicationSubmission;
    }),
  withdrawApplicationSubmission: protectedProcedure
    .input(
      z.object({
        applicationSubmissionId: z.string(),
        applicationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { applicationSubmissionId, applicationId } = input;

      await ctx.prisma.applicationSubmissionAnswer.deleteMany({
        where: {
          applicationSubmissionId,
        },
      });

      const applicationSubmissionEvaluation =
        await ctx.prisma.applicationSubmissionEvaluation.findFirst({
          where: {
            applicationSubmissionId,
          },
        });

      if (applicationSubmissionEvaluation) {
        await ctx.prisma.applicationSubmissionEvaluation.delete({
          where: {
            id: applicationSubmissionEvaluation.id,
          },
        });
      }

      await ctx.prisma.applicationSubmission.delete({
        where: {
          id: applicationSubmissionId,
        },
      });

      const numSubmissions = await ctx.prisma.applicationSubmission.count({
        where: {
          applicationId,
        },
      });

      if (numSubmissions === 0) {
        const application = await ctx.prisma.application.findUnique({
          where: {
            id: applicationId,
          },
        });

        if (!application?.projectId) {
          await ctx.prisma.application.delete({
            where: {
              id: applicationId,
            },
          });
        }
      }
    }),
  getApplicationSubmissionByIdForEvaluator: t.procedure
    .input(
      z.object({
        projectId: z.string(),
        applicationSubmissionId: z.string(),
      }),
    )
    .use(isEvaluator)
    .query(async ({ ctx, input }) => {
      const { applicationSubmissionId } = input;

      const applicationSubmission =
        await ctx.prisma.applicationSubmission.findUniqueOrThrow({
          where: {
            id: applicationSubmissionId,
          },
          include: {
            applicationSubmissionAnswers: true,
            application: {
              include: {
                questions: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

      if (applicationSubmission) {
        const application = applicationSubmission.application;
        if (application.deadline && application.deadline < new Date()) {
          await ctx.prisma.application.update({
            where: {
              id: application.id,
            },
            data: {
              status: ApplicationStatus.CLOSED
            }
          })
        }
      }

      return applicationSubmission;
    }),
});
