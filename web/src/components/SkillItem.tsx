import { useState } from "react";
import { SkillModal } from "./SkillModal";

interface Props {
  name: string;
}

export function SkillItem({ name }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="skill-row"
      >
        <button
          className="tag clickable"
          onClick={() => setShowModal(true)}
          type="button"
        >
          {name}
        </button>
      </div>
      {showModal && (
        <SkillModal
          dirName={name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
