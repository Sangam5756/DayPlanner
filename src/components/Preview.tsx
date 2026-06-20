interface PreviewProps {
  time: string;
  title: string;
  meta: string;
  kind: string;
}

export function Preview({ time, title, meta, kind }: PreviewProps) {
  return (
    <div className="preview-row">
      <time>{time}</time>
      <i className={kind} />
      <div>
        <b>{title}</b>
        <small>{meta}</small>
      </div>
    </div>
  );
}
