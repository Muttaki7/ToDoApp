import React, { useEffect, useMemo, useState } from 'react'
import TodoItem from './TodoItem'

const LOCAL_STORAGE_KEY = 'react_todo_complete_v1'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

export default function App() {
  const [todos, setTodos] = useLocalStorage(LOCAL_STORAGE_KEY, [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('created_desc')
  const [recentlyDeleted, setRecentlyDeleted] = useState(null)

  const visible = useMemo(() => {
    let list = todos.slice()
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      )
    }
    if (filter === 'active') list = list.filter(t => !t.completed)
    if (filter === 'completed') list = list.filter(t => t.completed)

    const [by, dir] = sort.split('_')
    list.sort((a, b) => {
      if (by === 'created') {
        return dir === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
      }
      if (by === 'title') {
        return dir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      }
      return 0
    })
    return list
  }, [todos, filter, query, sort])

  function handleAdd(e) {
    e && e.preventDefault()
    const t = title.trim()
    if (!t) return
    const newTodo = {
      id: uid(),
      title: t,
      description: description.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setTodos(prev => [newTodo, ...prev])
    setTitle('')
    setDescription('')
  }

  function toggleComplete(id) {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      )
    )
  }

  function deleteTodo(id) {
    const toRemove = todos.find(t => t.id === id)
    if (!toRemove) return
    setTodos(prev => prev.filter(t => t.id !== id))
    setRecentlyDeleted({ item: toRemove, timeout: null })

    const timer = setTimeout(() => setRecentlyDeleted(null), 5000)
    setRecentlyDeleted(prev => ({ ...prev, timeout: timer }))
  }

  function undoDelete() {
    if (!recentlyDeleted) return
    clearTimeout(recentlyDeleted.timeout)
    setTodos(prev => [recentlyDeleted.item, ...prev])
    setRecentlyDeleted(null)
  }

  function editTodo(id, changes) {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, ...changes, updatedAt: Date.now() } : t
      )
    )
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Todo App</h1>
          <p className="text-sm text-slate-500">Add, edit, delete, and mark tasks as complete.</p>
        </header>

        <main className="bg-white dark:bg-slate-800 shadow rounded-lg p-4">
          <form onSubmit={handleAdd} className="grid gap-3">
            <div className="flex gap-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                placeholder="What needs to be done?"
                autoFocus
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
                Add
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="border rounded px-3 py-2 resize-none"
              placeholder="Optional details"
            />

            <div className="flex gap-2 items-center flex-wrap">
              <label>Filter:</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              <label>Sort:</label>
              <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded px-2 py-1">
                <option value="created_desc">Newest</option>
                <option value="created_asc">Oldest</option>
                <option value="title_asc">Title A→Z</option>
                <option value="title_desc">Title Z→A</option>
              </select>

              <input
                placeholder="Search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="border rounded px-2 py-1 ml-auto"
              />
            </div>
          </form>

          <ul className="space-y-2 mt-4">
            {visible.length === 0 && <li className="text-sm text-slate-500 p-4">No todos found.</li>}
            {visible.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggleComplete(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
                onEdit={(changes) => editTodo(todo.id, changes)}
              />
            ))}
          </ul>

          <footer className="mt-4 flex items-center gap-3">
            <div className="text-sm text-slate-600">{todos.length} total</div>
            <button onClick={clearCompleted} className="text-sm text-red-600 hover:underline">
              Clear completed
            </button>
            {recentlyDeleted && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-slate-600">Deleted "{recentlyDeleted.item.title}"</span>
                <button onClick={undoDelete} className="px-2 py-1 bg-slate-200 rounded">
                  Undo
                </button>
              </div>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}
