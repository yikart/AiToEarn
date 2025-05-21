import sxRequest from "@/utils/request";

export const getMoneyStampApi = () => {
  return sxRequest.get<any>("cfg/money/stamp");
};

export const fluxSchnellApi = (data: any) => {
  return sxRequest.post<any>("experience-ai/text2image/flux_schnell", data);
};
