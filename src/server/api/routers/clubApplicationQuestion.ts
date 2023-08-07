import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ClubApplicationQuestionType } from "@prisma/client";

export const clubApplicationQuestionRouter = createTRPCRouter({
  createClubApplicationQuestion: protectedProcedure
    .input(
      z.object({
        clubApplicationId: z.string(),
        required: z.boolean(),
        orderNumber: z.number(),
        question: z.string(),
        type: z.enum([
          ClubApplicationQuestionType.FILE_UPLOAD,
          ClubApplicationQuestionType.MULTIPLE_CHOICE,
          ClubApplicationQuestionType.MULTIPLE_SELECT,
          ClubApplicationQuestionType.TEXT_FIELD,
          ClubApplicationQuestionType.TEXT_INPUT,
        ])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { clubApplicationId, required, orderNumber, question, type } = input;

      const clubApplicationQuestion = await ctx.prisma.clubApplicationQuestion.create({
        data: {
          clubApplication: {
            connect: {
              id: clubApplicationId
            }
          },
          required,
          orderNumber,
          question,
          type
        }
      });

      return clubApplicationQuestion;
    }),
  updateClubApplicationQuestion: protectedProcedure
    .input(
      z.object({
        clubApplicaitonQuestionId: z.string(),
        required: z.boolean(),
        orderNumber: z.number(),
        question: z.string(),
        type: z.enum([
          ClubApplicationQuestionType.FILE_UPLOAD,
          ClubApplicationQuestionType.MULTIPLE_CHOICE,
          ClubApplicationQuestionType.MULTIPLE_SELECT,
          ClubApplicationQuestionType.TEXT_FIELD,
          ClubApplicationQuestionType.TEXT_INPUT,
        ])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { clubApplicaitonQuestionId, required, orderNumber, question, type } = input;

      const clubApplicationQuestion = await ctx.prisma.clubApplicationQuestion.update({
        where: {
          id: clubApplicaitonQuestionId
        },
        data: {
          required,
          orderNumber,
          question,
          type,
        }
      });

      return clubApplicationQuestion;
    }),
  deleteAllClubApplicationQuestionsByClubApplicationId: protectedProcedure
    .input(
      z.object({
        clubApplicationId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { clubApplicationId } = input;

      const clubApplicationQuestions = await ctx.prisma.clubApplicationQuestion.deleteMany({
        where: {
          clubApplicationId
        }
      });

      return clubApplicationQuestions;
    })
})