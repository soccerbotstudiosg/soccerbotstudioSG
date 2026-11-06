import { PLAYER_APP_STORES } from "@/domain/catalog";
/** Render the same official player-app destinations in the prompt and footer. */
export function PlayerAppLinks({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "footer-app-links" : "app-store-links"}>
      {PLAYER_APP_STORES.map((store, index) => (
        <a
          className={compact ? "footer-app-link" : "app-store-link"}
          key={store.label}
          href={store.url}
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
          aria-label={store.label}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {index === 0 ? (
              <path
                fill="currentColor"
                d="M16.8 2c.2 1.5-.4 2.8-1.2 3.7-.9.9-2.1 1.4-3.2 1.3-.2-1.4.5-2.8 1.3-3.6.9-.9 2.2-1.5 3.1-1.4ZM20 17.5c-.5 1.2-.8 1.7-1.5 2.7-.9 1.3-2.1 2.9-3.6 2.9-1.3 0-1.7-.9-3.5-.9s-2.3.9-3.5.9c-1.5 0-2.6-1.4-3.5-2.7C1.8 16.7 1.3 12.2 3 9.7c1.2-1.8 3-2.8 4.7-2.8 1.4 0 2.3.8 3.5.8 1.1 0 1.8-.8 3.5-.8 1.4 0 2.9.7 4 1.9-3.5 2-2.9 7.1 1.3 8.7Z"
              />
            ) : index === 1 ? (
              compact ? (
                <>
                  <path
                    d="m7 4-2-3m12 3 2-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4 11a8 8 0 0 1 16 0H4Zm0 2h16v7H4Z"
                    fill="currentColor"
                  />
                  <path
                    d="M2 13v6m20-6v6M8 20v3m8-3v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="8" r="1" fill="var(--color-surface)" />
                  <circle cx="16" cy="8" r="1" fill="var(--color-surface)" />
                </>
              ) : (
                <path
                  d="M3 2v20l13-10L3 2Zm14 9 4-3L7 2l10 9Zm0 2 4 3L7 22l10-9Z"
                  fill="currentColor"
                />
              )
            ) : (
              <>
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m4 7 6 1 1 4-4 3 1 5m7-17-2 5 5 3 3-1m-8 5 5 1-2 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>
          {!compact && <strong>{store.label}</strong>}
        </a>
      ))}
    </div>
  );
}
