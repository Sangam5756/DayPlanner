export function ScoreRing({ score }: { score: number }) {
  return (
    <div className="ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
      <span>{score}<small>%</small></span>
    </div>
  );
}
