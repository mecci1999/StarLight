it('sends pointer and mouse events in order', () => {
  const events: any[] = []
  const $btn = cy.$$('#button')

  _.each('pointerdown mousedown pointerup mouseup click'.split(' '), (event) => {
    $btn.get(0).addEventListener(event, () => {
      events.push(event)
    })
  })

  cy.get('#button')
    .click()
    .then(() => {
      expect(events).to.deep.eq(['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
    })
})

it('will not send mouseEvents/focus if pointerdown is defaultPrevented', () => {
  const $btn = cy.$$('#button')

  const onEvent = cy.stub().callsFake((e) => {
    e.preventDefault()
    expect(e.defaultPrevented).to.be.true
  })

  $btn.get(0).addEventListener('pointerdown', onEvent)

  attachMouseClickListeners({ $btn })

  cy.get('#button').click().should('not.have.focus')

  cy.getAll('$btn', 'pointerdown pointerup click').each(shouldBeCalledOnce)
  cy.getAll('$btn', 'mousedown mouseup').each(shouldNotBeCalled)
})
