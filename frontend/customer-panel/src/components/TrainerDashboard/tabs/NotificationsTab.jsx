import React from 'react';

export default function NotificationsTab({
  notifications,
  markTrainerNotificationRead,
  loadNotifications,
}) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-serif text-white tracking-wide">Trainer Notifications & Alerts</h2>
      <div className="trainer-glass-card divide-y divide-neutral-900">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">No pending alerts.</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-neutral-200">{n.title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              {!n.isRead && (
                <button
                  onClick={async () => {
                    await markTrainerNotificationRead(n._id);
                    loadNotifications();
                  }}
                  className="text-[10px] text-[#c5a880] hover:underline"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
