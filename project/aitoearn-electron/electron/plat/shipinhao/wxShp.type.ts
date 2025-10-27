interface Location {
  longitude: number;
  latitude: number;
  country: string;
  countryCode: string;
  province: string;
  city: string;
  region: string;
  poiCheckSum: string;
}

interface POI {
  uid: string;
  name: string;
  longitude: number;
  latitude: number;
  address: string;
  province: string;
  city: string;
  region: string;
  fullAddress: string;
  source: number;
  poiCheckSum: string;
}

interface Data {
  eventList: WxSphEventList[];
  lastBuff: string;
  continueFlag: boolean;
}

export interface WxSphEventList {
  eventTopicId: string;
  eventName: string;
  eventCreatorNickname: string;
}

export interface WeChatVideoApiResponse {
  errCode: number;
  errMsg: string;
  data: Data;
}

export interface WeChatLocationData {
  errCode: number;
  errMsg: string;
  data: {
    list: POI[];
    cookies: string;
    address: Location;
    continueFlag: number;
  };
}

interface WeChatVideoUser {
  username: string;
  headImgUrl: string;
  nickName: string;
  authImgUrl: string;
  authCompanyName: string;
}

export interface WeChatVideoUserData {
  errCode: number;
  errMsg: string;
  data: {
    list: WeChatVideoUser[];
    totalCount: number;
  };
}

export interface SphGetPostListResponse {
  errCode: number; // 0;
  errMsg: string; // 'request successful';
  data: {
    list: {
      commentList: any[]; // []
      objectId: string; //'export/UzFfAgtgekIEAQAAAAAAOhIpzVxlAQAAAAstQy6ubaLX4KHWvLEZgBPExKFQKCowfoSJzNPgMJrD53jJrD_NBzgU3Ncr3usg';
      createTime: number; // 1741695600;
      likeCount: number; // 0;
      commentCount: number; // 2;
      readCount: number; // 179;
      forwardCount: number; // 0;
      favCount: number; // 1;
      commentClose: number; // 0;
      visibleType: number; // 1;
      status: number; // 1;
      desc: {
        media: {
          spec: any[];
          url: string; // 'https://finder.video.qq.com/251/20302/stodownload?encfilekey=Cvvj5Ix3eewK0tHtibORqcsqchXNh0Gf3sJcaYqC2rQDU5W1jYgILickxkJbjKjCA0skc49CeUbEks0sibuZiaibwQtatVH36DrA4RMiahjHkvAnuexRR8PIU1aUV21WSwOPRd&token=Cvvj5Ix3eewUo13ia09jtLw4nzPEZ0ias6WossfHM76uPFlClLIfTfsFxHS4QJJg4M52GoRJJVV1apGUpUDXaL1XrLckI8PmvWrNpyzDp5Kkpmdjaibb8VLdpj9tlO1icudZ9rgSqhevAB8OxZjUr5UNTk75rEDAv9cADibb2Wx3cGyyTRAjPdUs679Mho6aAkV7r&idx=1&bizid=1023&dotrans=0&hy=SH&m=&uzid=1&web=1';
          thumbUrl: string; // 'https://finder.video.qq.com/251/20304/stodownload?encfilekey=S7s6ianIic0ia4PicKJSfB8EjyjpQibPUAXolPZYpiae6M5FCeWvaib76vAJ6gaDiazGwGHqGF3FfswaNmyszKNzIlo7mOFB4PqcVll7iasQMzLYL7N6GicD6zcfOGww&token=o3K9JoTic9IhZNy9rvFF19YdS0Ej1KlFbPdgZw0k4Xicia8hcnPcxYp5eGVTBeNQ4ZAgoxjlhjjKHaxzg1dib7FAPEQuXvLHdaZuLj91kArMIT8cXmIBHuJY6Zk8HVW0dcyzemUOccm3en5nQ3dwIed3uc2AcezIozkgPDe5pre0tjAwDrtPoTeCVQ&idx=1&bizid=1023&dotrans=0&hy=SH&m=&uzid=1';
          mediaType: number; // 4;
          videoPlayLen: number; // 17;
          width: number; // 720;
          height: number; // 1280;
          md5sum: string; // '6bc1da4fb3224c28c19e9dfd1e077c19';
          fileSize: string; // '10132537';
          bitrate: number; // 4613120;
          coverUrl: string; // 'https://finder.video.qq.com/251/20304/stodownload?encfilekey=rjD5jyTuFrIpZ2ibE8T7YmwgiahniaXswqzmBbTGWBbgZKiaUl56F8wcYSPDRlQqZmtSct3JYHtJHl0Eal0qkCbP2NEFkepZYeh5VnibDXhuvE7dy0jCNa96ZVw&token=2lt8WBSnjTmtsqoH1VcEvDTFaR2SnFUYmDhrIsRVhu6HhdyGOls5ibYXnWXqib9bcXvehgEic5JO6RP96bG3P6WPyyHe5VEyg54PrM6WP4sRqLtNkIUzNAHicc6xmwL8UOtwyeq37Lcf3ic1icMibSXKc6g2ZOZXgdnyE9diaKt3WazBHMRD8c0icInmtOQ&idx=1&hy=SH&m=&scene=2';
          fullThumbUrl: string; // '';
          fullUrl: string; // '';
          fullWidth: number; // 0;
          fullHeight: number; // 0;
          fullMd5sum: string; // '';
          fullFileSize: string; // '0';
          fullBitrate: number; // 0;
          halfRect: any; // {};
          fullCoverUrl: string; // 'https://finder.video.qq.com/251/20304/stodownload?encfilekey=rjD5jyTuFrIpZ2ibE8T7YmwgiahniaXswqzmBbTGWBbgZKiaUl56F8wcYSPDRlQqZmtSct3JYHtJHl0Eal0qkCbP2NEFkepZYeh5VnibDXhuvE7dy0jCNa96ZVw&token=o3K9JoTic9IhZNy9rvFF19exicGwXO43K38lOWeKkiaONWmIf7iaZlVef8hOBfFvB1f6yUJruuNI2EEFicrRfIOgYEh9v7MQ58ibMLbQxDN56eL7T2c8BtKAVmUib3pKGU87JmPjfR9jpnSXSPibsc9PaznwHyNJfldyhQ3Tn6z7V1b1RAWKjHpq27UI2Q&idx=1&hy=SH&m=&scene=2';
          cardShowStyle: number; // 0;
        }[];
        mentionedMusics: any[];
        shortTitle: {
          shortTitle: string; // '我家的干饭宝宝';
        }[];
        description: string; // '#干饭宝宝';
        mediaType: number; // 4;
        location: {
          longitude: number; // 117.07821655273438;
          latitude: number; // 39.982460021972656;
          city: string; // '廊坊市';
          poiClassifyId: string; // '';
        };
        extReading: any; //  {};
        topic: any; // {};
        feedLocation: any; // {};
        event: {
          eventTopicId: string; // '';
          eventName: string; // '';
          eventCreatorNickname: string; // '';
          eventAttendCount: number; // 0;
        };
        audio: any; // {};
        member: any; // {};
        finderNewlifeDesc: any; // {};
      };
      objectType: number; // 0;
      attachList: { attachments: any[] };
      flag: number; // 0;
      objectNonce: string; // '12188256280973362673';
      permissionFlag: number; // 0;
      canSetOriginalsoundTitle: true;
      fullPlayRate: number; // 0.0782122905027933;
      avgPlayTimeSec: number; // 6.877094972067039;
      disableInfo: { isDisabled: false };
      showOriginal: false;
      exportId: string; // 'export/UzFfAgtgekIEAQAAAAAAOhIpzVxlAQAAAAstQy6ubaLX4KHWvLEZgBPExKFQKCowfoSJzNPgMJrD53jJrD_NBzgU3Ncr3usg';
      ringsetCount: number; // 0;
      snscoverCount: number; // 0;
      statusrefCount: number; // 0;
      forwardAggregationCount: number; // 0;
      originalInfo: {
        auditOriginalFlag: number; // 0;
        isDeclared: number; // 0;
        isOriginalUpgrad: number; // 0;
      };
      followCount: number; // 1;
      fastFlipRate: number; // 0.49162011173184356;
      forwardSnsCount: number; // 0;
      forwardAllChatCount: number; // 0;
      argsInfo: {
        poiCheckSum: string; // '99b069319e6b279e8aff6ec656879f25' };
      }[];
      yesterdayReadCount: number; // 143
    }[];
    bindInfo: any[];
    totalCount: number;
  };
}

export interface CommentInfo {
  levelTwoComment: CommentInfo[]; // 二级评论
  commentId: string; // '14610404657143548189';
  commentNickname: string; // '义务之后是金钱';
  commentContent: string; // '可爱吧';
  commentHeadurl: string; // 'http://wx.qlogo.cn/finderhead/Q3auHgzwzM5OEKzc5UdzOUJUbOsaCtSkcCctCb9ddrCKiag4ZibQ73oA/0';
  commentCreatetime: string; // '1741695959';
  commentLikeCount: number; // 0;
  lastBuff: string; // '';
  downContinueFlag: number; //  0;
  visibleFlag: number; // 0;
  readFlag: true;
  displayFlag: number; // 514;
  blacklistFlag: number; // 0;
  likeFlag: number; // 0;
  replyCommentId?: string; // '14610404657143548189';
  replyContent?: string; // '可爱吧';
}

export interface SphGetCommentListResponse {
  errCode: number;
  errMsg: string;
  data: {
    comment: CommentInfo[];
    lastBuff: string; // 'AATVfYAEAAABAAAAAADWiCo0vu4ltcc8lXzRZyAAAADzrBEppsryM1QLZ+dDmBLm9XwcA0exd+eEMM5e+lsrR+oHHo2NIZY18J6IkJAbntQxZiEBkXZ24Y1hrnqW334ItvllglnXoA==',
    commentCount: number; // 2;
    downContinueFlag: number; // 0;
  };
}

// 微信视频号的合集
export interface WxSPHGetMixListResponse {
  errCode: number;
  data: {
    collectionList: {
      id: string;
      name: string;
      desc: string;
      coverImgUrl?: string;
      feedCount: number;
    }[];
    collectionListCount: number;
  };
}
