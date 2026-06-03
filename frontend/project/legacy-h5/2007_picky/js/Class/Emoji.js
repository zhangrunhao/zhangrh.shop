const substringByByte = function (str, maxLength) {
  var result = ''
  var flag = false
  var len = 0
  var length = 0
  var length2 = 0
  for (var i = 0; i < str.length; i++) {
    var code = str.codePointAt(i).toString(16)
    if (code.length > 4) {
      i++
      if ((i + 1) < str.length) {
        flag = str.codePointAt(i + 1).toString(16) === '200d'
      }
    }
    if (flag) {
      len += getByteByHex(code)
      if (i === str.length - 1) {
        length += len
        if (length <= maxLength) {
          result += str.substr(length2, i - length2 + 1)
        } else {
          break
        }
      }
    } else {
      if (len !== 0) {
        length += len
        length += getByteByHex(code)
        if (length <= maxLength) {
          result += str.substr(length2, i - length2 + 1)
          length2 = i + 1
        } else {
          break
        }
        len = 0
        continue
      }
      length += getByteByHex(code)
      if (length <= maxLength) {
        if (code.length <= 4) {
          result += str[i]
        } else {
          result += str[i - 1] + str[i]
        }
        length2 = i + 1
      } else {
        break
      }
    }
  }
  return result
}

/* 通过文字二进制得到文字字节数 */
function getByteByBinary (binaryCode) {
  /**
   * 二进制 Binary system,es6表示时以0b开头
   * 八进制 Octal number system,es5表示时以0开头,es6表示时以0o开头
   * 十进制 Decimal system
   * 十六进制 Hexadecimal,es5、es6表示时以0x开头
   */
  var byteLengthDatas = [0, 1, 2, 3, 4]
  var len = byteLengthDatas[Math.ceil(binaryCode.length / 8)]
  return len
}
/* 通过文字十六进制得到文字字节数 */
function getByteByHex (hexCode) {
  return getByteByBinary(parseInt(hexCode, 16).toString(2))
}

export default substringByByte

// let str = '123👩‍🦱你好'
// str = 'abcabcabc'
// console.log(substringByByte(str, 4)) // 123
// console.log(substringByByte(str, 6)) // 123
// console.log(substringByByte(str, 10)) // 123👩‍🦱
// console.log(substringByByte(str, 11)) // 123👩‍🦱
// console.log(substringByByte(str, 13)) // 123👩‍🦱你
