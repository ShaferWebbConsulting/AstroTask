export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {description && <p className="state__description">{description}</p>}
      {action}
    </div>
  )
}
