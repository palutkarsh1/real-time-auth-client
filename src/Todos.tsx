import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button" // Shadcn UI Button
import { Input } from "@/components/ui/input"   // Shadcn UI Input
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // Shadcn UI Card
import { Trash2, LogOut, Plus, Laptop, Smartphone } from "lucide-react" // Icons
import { API_URL } from './config';

// TYPES: Define what our data looks like (TypeScript)
interface Todo {
    id: number;
    task: string;
}

interface Session {
    id: string; // The "Wristband" ID
    device: string; // Browser Name
    created_at: string;
}

function Todos() {
    // STATE: Where we store data in the browser's memory
    const [todos, setTodos] = useState<Todo[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [newTask, setNewTask] = useState('');
    const navigate = useNavigate();

    // EFFECT: Run this when the page loads
    useEffect(() => {
        fetchTodos();
        fetchSessions();
    }, []);

    // 1. FETCH TODOS (Read from Backend)
    const fetchTodos = async () => {
        try {
            // credentials: 'include' is CRITICAL!
            // It sends the cookie ("Wristband") to the server.
            const response = await fetch(`${API_URL}/todos`, {
                credentials: 'include',
            });

            if (response.status === 401) {
                // If server says "I don't know you" (401), go to login
                navigate('/login');
                return;
            }

            const data = await response.json();
            setTodos(data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };

    // 2. FETCH ACTIVE SESSIONS
    const fetchSessions = async () => {
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                credentials: 'include',
            });
            const data = await response.json();
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    // 3. ADD TODO
    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault(); // Stop page refresh
        if (!newTask) return;

        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ task: newTask }),
            });

            const data = await response.json();
            if (data.id) {
                setTodos([...todos, { id: data.id, task: data.task }]); // Update UI list
                setNewTask(''); // Clear input
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    // 4. DELETE TODO
    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                // Remove from UI list
                setTodos(todos.filter((todo) => todo.id !== id));
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    // 5. REVOKE SESSION (Logout another device)
    const handleRevokeSession = async (sessionId: string) => {
        try {
            const response = await fetch(`${API_URL}/sessions/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sessionId }),
            });

            if (response.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId)); // Remove from UI
            }
        } catch (error) {
            console.error('Error revoking session:', error);
        }
    };

    // 6. LOGOUT (Current device)
    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            navigate('/login');
        } catch (error) {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-8">

            {/* PART 1: TODOS CARD */}
            <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-7">
                    <CardTitle className="text-2xl font-bold">My Todos</CardTitle>
                    <Button variant="destructive" size="sm" onClick={handleLogout} className="flex gap-2">
                        <LogOut size={16} /> Logout
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                        <Input
                            type="text"
                            placeholder="Add a new task..."
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" className="flex gap-2">
                            <Plus size={16} /> Add
                        </Button>
                    </form>

                    <div className="space-y-3">
                        {todos.map((todo) => (
                            <div key={todo.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg border">
                                <span className="font-medium">{todo.task}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(todo.id)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        ))}
                        {todos.length === 0 && (
                            <p className="text-center py-10 text-muted-foreground">No tasks yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* PART 2: ACTIVE SESSIONS CARD */}
            <Card className="max-w-2xl mx-auto shadow-md border-t-4 border-blue-500">
                <CardHeader>
                    <CardTitle className="text-xl">Active Sessions</CardTitle>
                    <CardDescription>All devices currently logged into your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex justify-between items-center p-4 bg-white border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                                        {/* Simple icon logic based on string check */}
                                        {session.device.toLowerCase().includes('mobile') ? <Smartphone size={20} /> : <Laptop size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{session.device}</p>
                                        <p className="text-xs text-muted-foreground">
                                            ID: {session.id.substring(0, 8)}...
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevokeSession(session.id)}
                                >
                                    Revoke
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

export default Todos;
