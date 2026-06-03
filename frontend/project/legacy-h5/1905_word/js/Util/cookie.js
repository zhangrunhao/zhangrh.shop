/**
 * 获取 cookie
 * @param name
 * @returns {*}
 */
export const getCookie = function (name) {
  var cookieName = encodeURIComponent(name) + '='
  var cookieStart = document.cookie.indexOf(cookieName)
  var cookieValue = null
  var cookieEnd

  if (cookieStart > -1) {
    cookieEnd = document.cookie.indexOf(';', cookieStart)
    if (cookieEnd === -1) {
      cookieEnd = document.cookie.length
    }
    cookieValue = decodeURIComponent(document.cookie.substring(cookieStart +
      cookieName.length, cookieEnd))
  }

  return cookieValue
}

/**
 * 设置 cookie
 * @param name
 * @param value
 * @param expires
 * @param path
 * @param domain
 * @param secure
 */
export const setCookie = function (name, value, expires, path, domain, secure) {
  var cookieText = encodeURIComponent(name) + '=' +
    encodeURIComponent(value)

  if (expires instanceof Date) {
    cookieText += '; expires=' + expires.toUTCString()
  }

  if (path) {
    cookieText += '; path=' + path
  }

  if (domain) {
    cookieText += '; domain=' + domain
  }

  if (secure) {
    cookieText += '; secure'
  }

  document.cookie = cookieText
}
