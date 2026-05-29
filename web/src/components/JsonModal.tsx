interface Props {
  json: object;
  onClose: () => void;
}

export function JsonModal({ json, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">配置文件</h2>
        <pre className="json-preview">
          {syntaxHighlight(JSON.stringify(json, null, 2))}
        </pre>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

function syntaxHighlight(json: string): React.ReactNode[] {
  const lines = json.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    const regex = /("(?:[^"\\]|\\.)*")\s*:/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${i}-pre`}>{line.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<span key={`${i}-key`} style={{ color: "#0550ae" }}>{match[1]}</span>);
      parts.push(<span key={`${i}-colon`}>{line.slice(match.index + match[1].length, regex.lastIndex)}</span>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      const rest = line.slice(lastIndex);
      const stringMatch = rest.match(/^(\s*)("(?:[^"\\]|\\.)*")(.*)$/);
      if (stringMatch) {
        parts.push(<span key={`${i}-ws`}>{stringMatch[1]}</span>);
        parts.push(<span key={`${i}-str`} style={{ color: "#0a3069" }}>{stringMatch[2]}</span>);
        parts.push(<span key={`${i}-rest`}>{stringMatch[3]}</span>);
      } else {
        const numMatch = rest.match(/^(\s*)(\d+)(.*)$/);
        if (numMatch) {
          parts.push(<span key={`${i}-ws`}>{numMatch[1]}</span>);
          parts.push(<span key={`${i}-num`} style={{ color: "#0550ae" }}>{numMatch[2]}</span>);
          parts.push(<span key={`${i}-rest`}>{numMatch[3]}</span>);
        } else {
          parts.push(<span key={`${i}-rest`}>{rest}</span>);
        }
      }
    }

    return <div key={i}>{parts.length > 0 ? parts : line}</div>;
  });
}
