// https://webdriver.io/docs/devtools-service/#cdp-command
it('should take JS coverage', () => {
  /**
   * enable necessary domains
   */
  browser.cdp('Profiler', 'enable')
  browser.cdp('Debugger', 'enable')

  /**
   * start test coverage profiler
   */
  browser.cdp('Profiler', 'startPreciseCoverage', {
    callCount: true,
    detailed: true
  })

  browser.url('http://google.com')

  /**
   * capture test coverage
   */
  const { result } = browser.cdp('Profiler', 'takePreciseCoverage')
  const coverage = result.filter((res) => res.url !== '')
  console.log(coverage)
})
