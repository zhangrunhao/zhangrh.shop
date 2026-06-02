const questions = [
  {
    no: 1,
    data: '森',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '木' },
      { key: 'b', value: '木' },
      { key: 'c', value: '木' },
      { key: 'd', value: '日' },
      { key: 'e', value: '口' },
      { key: 'f', value: '水' }
    ]
  },
  {
    no: 2,
    data: '品',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '口' },
      { key: 'b', value: '口' },
      { key: 'c', value: '口' },
      { key: 'd', value: '田' },
      { key: 'e', value: '人' },
      { key: 'f', value: '木' }
    ]
  },
  {
    no: 3,
    data: '晶',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '日' },
      { key: 'b', value: '日' },
      { key: 'c', value: '日' },
      { key: 'd', value: '月' },
      { key: 'e', value: '目' },
      { key: 'f', value: '口' }
    ]
  },
  {
    no: 4,
    data: '众',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '人' },
      { key: 'b', value: '人' },
      { key: 'c', value: '人' },
      { key: 'd', value: '入' },
      { key: 'e', value: '大' },
      { key: 'f', value: '从' }
    ]
  },
  {
    no: 5,
    data: '磊',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '石' },
      { key: 'b', value: '石' },
      { key: 'c', value: '石' },
      { key: 'd', value: '山' },
      { key: 'e', value: '土' },
      { key: 'f', value: '王' }
    ]
  },
  {
    no: 6,
    data: '鑫',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '金' },
      { key: 'b', value: '金' },
      { key: 'c', value: '金' },
      { key: 'd', value: '全' },
      { key: 'e', value: '玉' },
      { key: 'f', value: '今' }
    ]
  },
  {
    no: 7,
    data: '淼',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '水' },
      { key: 'b', value: '水' },
      { key: 'c', value: '水' },
      { key: 'd', value: '氵' },
      { key: 'e', value: '小' },
      { key: 'f', value: '冰' }
    ]
  },
  {
    no: 8,
    data: '焱',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '火' },
      { key: 'b', value: '火' },
      { key: 'c', value: '火' },
      { key: 'd', value: '灬' },
      { key: 'e', value: '炎' },
      { key: 'f', value: '光' }
    ]
  },
  {
    no: 9,
    data: '垚',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '土' },
      { key: 'b', value: '土' },
      { key: 'c', value: '土' },
      { key: 'd', value: '士' },
      { key: 'e', value: '王' },
      { key: 'f', value: '山' }
    ]
  },
  {
    no: 10,
    data: '犇',
    answer: 'a,b,c',
    choice: [
      { key: 'a', value: '牛' },
      { key: 'b', value: '牛' },
      { key: 'c', value: '牛' },
      { key: 'd', value: '午' },
      { key: 'e', value: '生' },
      { key: 'f', value: '羊' }
    ]
  }
]

const localRank = [
  { realName: '本地玩家', headUrl: new URL('../../asset/result/avatar.png', import.meta.url).href, score: 10 },
  { realName: '汉字达人', headUrl: new URL('../../asset/home/main.png', import.meta.url).href, score: 9 },
  { realName: '偏旁高手', headUrl: new URL('../../asset/result/avatar.png', import.meta.url).href, score: 8 }
]

export const getAllQuestion = function () {
  return Promise.resolve(questions.map((question) => ({
    no: question.no,
    data: question.data,
    answer: question.answer,
    choice: question.choice.map((item) => ({ ...item }))
  })))
}

export const getVerifyAnswer = function (userId, questionId, answer) {
  const question = questions.find((item) => item.no === questionId)
  if (!question) {
    return Promise.reject(new Error(`Unknown question: ${questionId}`))
  }

  return Promise.resolve({
    data: question.data,
    result: answer === question.answer
  })
}

export const getRankList = function () {
  return Promise.resolve({
    rank: -1,
    data: localRank
  })
}
