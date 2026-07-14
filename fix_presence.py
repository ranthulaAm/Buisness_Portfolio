import sys

with open("services/dataService.ts", "r") as f:
    content = f.read()

old_code = """export const listenToActiveUsers = (callback: (count: number) => void): Unsubscribe => {
  const q = query(collection(db, 'presence'), where('lastActive', '>', Date.now() - 60000));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Error listening to active users: ", error);
  });
};"""

new_code = """export const listenToActiveUsers = (callback: (count: number) => void): Unsubscribe => {
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

content = content.replace(old_code, new_code)

with open("services/dataService.ts", "w") as f:
    f.write(content)
