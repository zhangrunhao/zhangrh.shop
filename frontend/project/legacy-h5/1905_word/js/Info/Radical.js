// 偏旁信息

export default class RadicalInfo {
  constructor () {
    this.count = 10
    this.detail = [
      {
        index: 0,
        id: 'GONG',
        text: '弓'
      },
      {
        index: 1,
        id: 'HUO',
        text: '火'
      },
      {
        index: 2,
        id: 'RI',
        text: '日'
      },
      {
        index: 3,
        id: 'SHENG',
        text: '生'
      },
      {
        index: 4,
        id: 'HE',
        text: '禾'
      },
      {
        index: 5,
        id: 'XIN',
        text: '心'
      },
      {
        index: 6,
        id: 'SHI',
        text: '失'
      },
      {
        index: 7,
        id: 'LIDAO',
        text: '立刀'
      },
      {
        index: 8,
        id: 'KOU',
        text: '口'
      },
      {
        index: 9,
        id: 'SHUXIN',
        text: '竖心'
      }
    ]
  }
  getDetail () {
    return this.detail
  }
}
