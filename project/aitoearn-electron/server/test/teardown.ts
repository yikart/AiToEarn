export default async () => {
  await global.mongo?.stop();
  // await global.redis?.stop();
};
