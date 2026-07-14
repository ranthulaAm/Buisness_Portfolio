import sys

with open("services/dataService.ts", "r") as f:
    content = f.read()

old_code = """export const listenToActiveUsers = (callback: (count: number) => void): Unsubscribe => {
  let isUnsubscribed = false;
  let interval: any;

  const poll = async () => {
    if (isUnsubscribed) return;
    try {
      const q = query(collection(db, 'presence'), where('lastActive', '>', Date.now() - 60000));
      const snapshot = await getDocs(q);
      if (!isUnsubscribed) callback(snapshot.size);
    } catch (error) {
      console.error("Error polling active users: ", error);
    }
  };

  poll();
  interval = setInterval(poll, 15000);

  return () => {
    isUnsubscribed = true;
    clearInterval(interval);
  };
};"""

new_code = """export const listenToActiveUsers = (callback: (count: number) => void): Unsubscribe => {
  // Listen to users active in the last 2 hours to keep the working set small
  const q = query(collection(db, 'presence'), where('lastActive', '>', Date.now() - 7200000));
  let latestDocs: any[] = [];
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    latestDocs = snapshot.docs.map(d => d.data());
    updateCount();
  });
  
  const updateCount = () => {
    const threshold = Date.now() - 45000; // 45 seconds
    const activeCount = latestDocs.filter(d => d.lastActive > threshold).length;
    callback(activeCount);
  };
  
  const interval = setInterval(updateCount, 5000);
  
  return () => {
    unsubscribe();
    clearInterval(interval);
  };
};"""

content = content.replace(old_code, new_code)

with open("services/dataService.ts", "w") as f:
    f.write(content)
