interface MembersErrorDisplayProps {
  error: string;
}

export const MembersErrorDisplay = ({ error }: MembersErrorDisplayProps) => {
  if (!error) {
    return null;
  }

  return (
    <div className="mx-4 my-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/60 dark:bg-red-950/40 sm:mx-5">
      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
    </div>
  );
};
