import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2a1a0e",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
        }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 32 32"
          fill="none"
          stroke="#e8a23a"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.5 4h7" />
          <path d="M13.5 4.4v6.3L7.1 23.3c-.7 1.3.2 3 1.7 3h14.4c1.5 0 2.4-1.7 1.7-3L18.5 10.7V4.4" />
          <path d="M10.4 18.5h11.2" />
          <circle cx="13" cy="22" r="1.05" fill="#e8a23a" stroke="none" />
          <circle cx="17.4" cy="21.4" r="1.05" fill="#e8a23a" stroke="none" />
          <circle cx="15.4" cy="24.2" r="1.05" fill="#e8a23a" stroke="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
