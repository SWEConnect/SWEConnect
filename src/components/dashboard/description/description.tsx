import DescriptionEditor from "./descriptionEditor";
import DescriptionOutline from "./descriptionOutline";

type PropType = {
  clubId: string;
  clubDescription: string;
  editable: boolean;
};

const Description = (props: PropType) => {
  const { clubId, clubDescription, editable } = props;

  return (
    <>
      <DescriptionOutline>
        <p className="flex flex-col justify-center px-8 text-center">
          {clubDescription}
        </p>
        {editable ? (
          <DescriptionEditor
            clubDescription={clubDescription}
            clubId={clubId}
          />
        ) : (
          <></>
        )}
      </DescriptionOutline>
    </>
  );
};

export default Description;
