import Image from "next/image";

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({
  name,
  email,
  image,
  size = 32,
}: {
  name: string | null;
  email: string;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return <Image src={image} alt="" width={size} height={size} className="avatar" />;
  }
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {initials(name, email)}
    </span>
  );
}
