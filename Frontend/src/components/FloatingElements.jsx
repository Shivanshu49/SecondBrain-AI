export default function FloatingElements({ items }) {
  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className={`float float-${i + 1}`}
          aria-hidden="true"
        >
          {item}
        </div>
      ))}
    </>
  )
}
