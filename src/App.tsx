import React, { useState, useEffect } from 'react';

// JSON data item definition
interface DataItem {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}


// Modal window for editing the records
const ModalComponent: React.FC<{
    item: DataItem | null;
    isOpen: boolean;
    onSave: (item: DataItem) => void;
    onCancel: () => void;
}> = ({ item, isOpen, onSave, onCancel }) => {
    const [editedItem, setEditedItem] = useState<DataItem | null>(null);

    const [errors, setErrors] = useState<{ userId?: string; title?: string }>({});


    // Configures which item from the dataset is being edited. Resets error messages.
    useEffect(() => {
        setEditedItem(item);

        const newErrors = {};
        setErrors(newErrors);
    }, [item]);

    // Breaks execution of code in case the modal is not opened, saves resources
    if (!isOpen || !editedItem) return null;

    // Handles new user input, parses the values from input fields
    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isSelectElement = e.target instanceof HTMLSelectElement;
        if (name === 'userId') {
            const valueAsNumber = Number(value);
            setEditedItem({
                ...editedItem,
                [name]: valueAsNumber,
            });
        } else if (name === 'completed') {
            // Convert the "Yes"/"No" dropdown value to boolean
            setEditedItem({
                ...editedItem,
                [name]: value === 'Yes',
            });
        } else {
            setEditedItem({
                ...editedItem,
                [name]: isSelectElement ? value : value,
            });
        }
    };

    // Validates the user input and set error messages
    const validateInput = () => {
        const newErrors = {};

        if (!editedItem.userId || editedItem.userId <= 0) {
            newErrors.userId = 'User ID is required and must be greater than zero.';
        }
        if (!editedItem.title || editedItem.title.trim() === '') {
            newErrors.title = 'Title must not be empty.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // Handles click on 'Save' button
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateInput() && editedItem) {
            onSave(editedItem);
        } else {
            // Handle the error state here, e.g., showing an error message
            console.error('Validation failed');
        }
    };

    // Returns aligned HTML form
    return (
        <div style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'black', padding: 20, borderRadius: 5, maxWidth: 500, margin: '20vh auto' }}>
                <h2 style={{ textAlign: 'center' }}>Edit Item</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '5px' }}>
                        <label>User ID:</label>
                        <input name="userId" type="number" value={editedItem.userId} onChange={handleChange} style={{ padding: '8px', width: '96%' }} />
                        {errors.userId && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.userId}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '5px' }}>
                        <label>Title:</label>
                        <input name="title" type="text" value={editedItem.title} onChange={handleChange} style={{ padding: '8px', width: '96%' }} />
                        {errors.title && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.title}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '5px' }}>
                        <label>Completed:</label>
                        <select name="completed" value={editedItem.completed ? "Yes" : "No"} onChange={handleChange} style={{ padding: '8px', width: '100%' }}>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" style={{ padding: '8px 16px' }}>Save</button>
                        <button type="button" onClick={onCancel} style={{ padding: '8px 16px' }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );

};

// Holds the main app logic
const App: React.FC = () => {
    // Holds the fetched dataset from remote url
    const [data, setData] = useState<DataItem[]>([]);

    // Deteremines the status of page (if data is being loaded) and creates method for setting the satus
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Determines the status of page (if there was error during fetch operation) and creates method for setting the error
    const [error, setError] = useState<string | null>(null);

    // Holds item selected for edit, defines method to set edited item
    const [editItem, setEditItem] = useState<DataItem | null>(null);

    // Holds information if modal was opened
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Holds current sorting direction and creates method for setting it
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Holds information if title header of table is hovered by mouse to change the cursor
    const [isHovering, setIsHovering] = useState<boolean>(false);

    // Holds information if the new item row is being display, creates method for setting it
    const [addingNewItem, setAddingNewItem] = useState<boolean>(false);

    // Holds new user ID for add record feature, creates method for setting it
    const [newUserId, setNewUserId] = useState('');

    // Holds new title for add record feature, creates method for setting it
    const [newTitle, setNewTitle] = useState('');

    // Holds new completed value for add record feature, creates method for setting it
    const [newCompleted, setNewCompleted] = useState(false);

    // Occurs on load of the page. Fetches the JSON from remote site, in case of problems displays an error. 
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try
            {
                const response = await fetch('https://jsonplaceholder.typicode.com/todos');
                if (!response.ok) throw new Error('Data could not be fetched');
                const jsonData = await response.json();
                setData(jsonData);
            } catch (err)
            {
                setError(err.message);
            } finally
            {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Method that sorts the data using the title field
    const toggleSort = () => {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);

        const sortedData = [...data].sort((a, b) => {
            if (a.title < b.title) return newDirection === 'asc' ? -1 : 1;
            if (a.title > b.title) return newDirection === 'asc' ? 1 : -1;
            return 0;
        });

        setData(sortedData);
    };

    // Handles click on Edit button of record, opens modal dialog
    const handleEdit = (item: DataItem) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    // Handles click on Delete button of record, displays standard confirmation dialog
    const handleDelete = (id: number) => {
        // Display a confirmation dialog box
        const isConfirmed = window.confirm("Are you sure you want to delete this item?");

        // If the user clicks "OK", proceed with deletion
        if (isConfirmed) {
            setData(data.filter(item => item.id !== id));
        }
    };

    // Handles click of save button in modal dialog. Finds index of edited item, updates the item and updates the collection displayed.
    // Then closes the modal dialog and clears related variables.
    const handleSave = (editedItem: DataItem) => {
        const index = data.findIndex(item => item.id === editedItem.id);
        const newData = [...data];
        if (index !== -1) {
            newData[index] = editedItem;
            setData(newData);
        }
        setIsModalOpen(false);
        setEditItem(null);
    };

    // Handles cancel click on modal window
    const handleCancel = () => {
        setIsModalOpen(false);
        setEditItem(null);
    };

    // Handles click on Add new button, adds row to the table displaying controls for adding item
    const handleAdd = () => {
        setAddingNewItem(true);
    };

    // Handles save of newly added item. Adds unique ID to the item, parses the form data and adds it to the collection.
    const handleSaveNew = () => {
        // Basic validation checks
        if (!newUserId.trim()) {
            alert('User ID is required.');
            return;
        }
        if (!newTitle.trim()) {
            alert('Title is required.');
            return;
        }
        const userIdNumber = parseInt(newUserId, 10);
        if (isNaN(userIdNumber) || userIdNumber <= 0) {
            alert('User ID must be a positive number.');
            return;
        }

        // Proceed with adding the new item if validation passes
        const newItem = {
            userId: userIdNumber,
            id: Math.max(0, ...data.map(d => d.id)) + 1,
            title: newTitle,
            completed: newCompleted,
        };
        setData(prevData => [newItem, ...prevData]);
        setAddingNewItem(false); // Exit adding new item mode

        // Reset input fields
        setNewUserId('');
        setNewTitle('');
        setNewCompleted(false);
    };

    // Sets that title column header is being hovered, effectively triggering the style change
    const toggleHover = () => {
        setIsHovering(true);
    };

    // Sets that title mouse cursor left the title column header, effectively triggering the style change
    const toggleMouseOut = () => {
        setIsHovering(false);
    };

    // Converts user role number from userID field to the string according to requirements (1 = admin, 2 = tester, 3 = unknown)
    const getUserRole = (userId: number): string => {
        switch (userId) {
            case 1:
                return 'Admin';
            case 2:
                return 'Tester';
            default:
                return 'Unknown user';
        }
    };


    // Holds style for table
    const tableStyle = {
        width: '100%',
        maxWidth: '100%', // Ensures table is not wider than the viewport
        borderCollapse: 'collapse',
        boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
        marginTop: '20px',
    };

    // Holds style for table header
    const thStyle = {
        backgroundColor: '#f0f0f0',
        color: '#333',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderBottom: '1px solid #ddd',
        textAlign: 'left',
        position: 'relative',
        height: '40', // Ensure all th elements have the same height
    };

    // Holds style for table header that can be used to sort items
    const sortableThStyle = {
        color: '#333',
        fontWeight: 'bold',
        padding: '10px 20px',
        borderBottom: '1px solid #ddd',
        textAlign: 'left',
        cursor: 'pointer',
        backgroundColor: isHovering ? '#e8e8e8' : '#f0f0f0', // Change background color on hover
    };

    // Holds style for table cell
    const tdStyle = {
        padding: '10px 20px',
        borderBottom: '1px solid #ddd',
        textAlign: 'left',
    };

    // Holds style for button
    const buttonStyle = {
        margin: '0 5px',
        padding: '5px 10px',
        cursor: 'pointer',
    };

    // Holds style for error message
    const errorStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // This assumes the error takes the full height of the viewport
        fontSize: '20px',
        color: 'red',
    };

    // Style ensuring nice look of table header when it contains add button
    const thStyleWithButton = {
        ...thStyle,
        display: 'flex',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
        whiteSpace: 'nowrap', // Prevent wrapping
    };

    // Style for add new button
    const addButtonStyle = {
        ...buttonStyle,
        padding: '5px 10px',
        fontSize: '1em',
        margin: '0 5px', // Same margin as for the "Actions" label
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        innerHeight: '4px',
    };

    // Displays loading or error message and quits execution
    if (isLoading) return <div style={{ ...errorStyle, color: 'black' }}>Loading...</div>;
    if (error) return <div style={errorStyle}>Error: {error}</div>;

    // Main return function that displays the table
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>User ID</th>
                        <th style={sortableThStyle} onClick={toggleSort} onMouseOver={toggleHover} onMouseOut={toggleMouseOut}>Title</th>
                        <th style={thStyle}>Completed</th>
                        <th style={thStyleWithButton}>
                            Actions
                            <button onClick={handleAdd} style={addButtonStyle}>
                                +
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {addingNewItem && (
                        <tr>
                            <td style={tdStyle}>
                                <input type="number" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="User ID" />
                            </td>
                            <td style={tdStyle}>
                                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" />
                            </td>
                            <td style={tdStyle}>
                                <select value={String(newCompleted)} onChange={(e) => setNewCompleted(e.target.value === 'true')}>
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </td>
                            <td style={tdStyle}>
                                <button style={buttonStyle} onClick={handleSaveNew}>Save</button>
                                <button style={buttonStyle} onClick={() => setAddingNewItem(false)}>Cancel</button>
                            </td>
                        </tr>
                    )}
                    {data.map((item) => (
                        <tr key={item.id}>
                            <td style={tdStyle}>{getUserRole(item.userId)}</td>
                            <td style={tdStyle}>{item.title}</td>
                            <td style={tdStyle}>{item.completed ? 'Yes' : 'No'}</td>
                            <td style={tdStyle}>
                                <button onClick={() => handleEdit(item)} style={buttonStyle}>Edit</button>
                                <button onClick={() => handleDelete(item.id)} style={buttonStyle}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/*Call of modal component*/}
            <ModalComponent item={editItem} isOpen={isModalOpen} onSave={handleSave} onCancel={handleCancel} />
        </div>
    );
};

export default App;
