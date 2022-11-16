export type User = {
  ethereum: {
    publicKey: string;
    privateKey: string;
  };
  starkex: {
    publicKey: string;
    privateKey: string;
  };
};

export const userA: User = {
  ethereum: {
    publicKey: '0x378A519cc7c80a208AFDd1d06f8661f4d0344d36',
    privateKey:
      '14814dbb8aa595dc66b2f40edfc10acf5a10339e97b21bce65a084d1fbca4120',
  },
  starkex: {
    publicKey:
      '0x02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01',
    privateKey:
      '0x05c76754a1087c1f89ab1a7ed3540244959e08fbb2b0e5dd6e00d90a42b642d4',
  },
};

export const userB: User = {
  ethereum: {
    publicKey: '0x967D614157424D2375DFc7A209df5Cc9fA81e2Fd',
    privateKey:
      '0xbce4425a9782e4c067d52ee36b51901fa612433e11594ed7b4180551f313a0ca',
  },
  starkex: {
    publicKey:
      '0x00c3c9df6ee7df6cdf69042b8b3487ff67dc8a47b0c28021c217b7ad8b189765',
    privateKey:
      '0x0324f4021870c102e7c7b67bcf33eed6e3796129a424a358bba542776848ade4',
  },
};

export const userC: User = {
  ethereum: {
    publicKey: '0x9aB2f5bBdc3D991CBDb5D834de69707921F15B35',
    privateKey:
      '0x9fbb14849ce00c67401ebff7528f2806fe6a94bdea61a59dab16c7166d8e9fb8',
  },
  starkex: {
    publicKey:
      '0x03b8075c730c891f55ba592aa03d01f770e3a9084c0d5b9df3750778f73e0200',
    privateKey:
      '0x03cef5fdcc9c002405548a3254bb4e259e1e6721df47f6ff5556fc7f8ab4ded4',
  },
};
