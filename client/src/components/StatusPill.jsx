export default function StatusPill({ poll }) {
  if (poll.isPublished) {
    return <span className="pill pill-green">Published</span>;
  }

  if (poll.expired || !poll.active) {
    return <span className="pill pill-red">Closed</span>;
  }

  return <span className="pill pill-blue">Live</span>;
}
