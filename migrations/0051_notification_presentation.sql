-- Preserve original payloads for requests already inside the provider retry window.
ALTER TABLE enquiry_requests ADD COLUMN notification_version INTEGER NOT NULL DEFAULT 0 CHECK(notification_version IN (0,1));
ALTER TABLE booking_support_reports ADD COLUMN notification_version INTEGER NOT NULL DEFAULT 0 CHECK(notification_version IN (0,1));
CREATE TRIGGER enquiry_notification_version_immutable
BEFORE UPDATE OF notification_version ON enquiry_requests
WHEN NEW.notification_version != OLD.notification_version
BEGIN SELECT RAISE(ABORT, 'notification_version_immutable'); END;
CREATE TRIGGER support_notification_version_immutable
BEFORE UPDATE OF notification_version ON booking_support_reports
WHEN NEW.notification_version != OLD.notification_version
BEGIN SELECT RAISE(ABORT, 'notification_version_immutable'); END;
