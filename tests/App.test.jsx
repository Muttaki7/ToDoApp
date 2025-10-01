import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../src/App'

test('adds a todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test task' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('Test task')).toBeInTheDocument()
})
