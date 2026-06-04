import { db } from "./db";

export class SyncManager {
  private isSyncing = false;

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;

    try {
      this.isSyncing = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sync-start"));
      }
      
      const metadata = await db.syncMetadata.get("default");
      if (!metadata || !metadata.userToken) {
        return; // Not logged in
      }

      // 1. Pull changes from Cloudflare
      await this.pullChanges(metadata);

      // 2. Push local changes to Cloudflare
      await this.pushChanges(metadata);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      this.isSyncing = false;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sync-end"));
      }
    }
  }

  private async pullChanges(metadata: any) {
    // TODO: fetch(`/api/sync/pull?since=${metadata.lastSyncTimestamp}`)
    // Apply changes to Dexie (Upsert)
    // Update lastSyncTimestamp in Dexie
    console.log("Mock pull changes...");
  }

  private async pushChanges(metadata: any) {
    // TODO: Find all records in Dexie where updatedAt > metadata.lastSyncTimestamp (or where deletedAt is set and not synced)
    // POST to `/api/sync/push`
    // If success, update lastSyncTimestamp
    console.log("Mock push changes...");
  }
}

export const syncManager = new SyncManager();
