/*
 * @Author: nevin
 * @Date: 2024-07-29 11:14:20
 * @LastEditTime: 2024-07-29 11:17:33
 * @LastEditors: nevin
 * @Description: 地图
 */
export function isWithinMeters(
  locus1: number[],
  locus2: number[],
  distanceInMeters: number, // 千米
) {
  const [lat1, lon1] = locus1;
  const [lat2, lon2] = locus2;

  const R = 6371; // 地球平均半径，单位为公里
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // 距离，单位为公里

  return distance <= distanceInMeters; // 判断距离是否小于等于500米
}

// 辅助函数，将角度转换为弧度
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
