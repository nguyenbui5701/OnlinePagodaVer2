// An active receiver needs heartbeats while the document's animation frames are suspended.
setInterval(() => self.postMessage(0), 100);
