import moment from 'moment'

export function getDate (value: string): string | undefined {
  if (!value) {
    return undefined
  }

  if (value === 'Invalid date') {
    // Make sure this weird value does not cause us problems
    return undefined
  }

  const dt = value.split(' ')
  if (dt.length > 1) {
    return dt[0] // we only want the date part
  } else if (dt.length === 1) {
    // If date is in the value
    if (dt[0].indexOf('-') > -1) {
      return dt[0]
    }
  }
}

export function getTime (value: string): string | undefined {
  if (!value) {
    return undefined
  }

  const dt = value.split(' ')

  if (dt.length > 1) {
    return dt[1] // we only want the time part
  } else if (dt.length === 1) {
    // If we time is in the value
    if (dt[0].indexOf(':') > -1) {
      return dt[0]
    }
  }
}

export function setDate (date: string, value: string, noDate = false, noTime = false): string | undefined {
  if (noDate || !date || !date.length) {
    return undefined
  }

  let dm: any = moment()
  const time = getTime(value)
  if (noTime) {
    dm = moment(date, 'YYYY-MM-DD')
    dm = dm.format('YYYY-MM-DD')
  } else {
    dm = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm')
    dm = dm.format('YYYY-MM-DD HH:mm')
  }

  return dm
}

export function setTime (time: string, value: string, noDate = false, noTime = false): string | undefined {
  if (noTime || !time || !time.length) {
    return undefined
  }

  let tm: any = moment()
  let date = getDate(value)
  if (noDate) {
    tm = moment(time, 'HH:mm')
    tm = tm.format('HH:mm')
  } else {
    if (!date) {
      // If no date is yet set default to today
      date = moment().format('YYYY-MM-DD')
    }
    tm = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm')
    tm = tm.format('YYYY-MM-DD HH:mm')
  }

  return tm
}
