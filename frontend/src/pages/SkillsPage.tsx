import React, { useEffect, useState } from 'react';
import { skillsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Skill {
  id: number;
  name: string;
  level: string;
  category?: string;
}

const skillLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
];

const SkillsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState({ name: '', level: 'Intermediate', category: '' });
  
  // Fetch skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const data = await skillsService.getAll<Skill[]>();
        
        // Defensive coding to ensure we always have an array of skills
        if (data) {
          if (Array.isArray(data)) {
            // Make sure all items in the array are valid Skill objects
            const validSkills = data.filter(skill => 
              skill && 
              typeof skill === 'object' && 
              'id' in skill && 
              'name' in skill && 
              'level' in skill
            );
            setSkills(validSkills);
          } else if (typeof data === 'object' && 'id' in data) {
            // Single skill object returned instead of array
            setSkills([data as unknown as Skill]);
          } else {
            console.error('Received invalid skills data format', data);
            setSkills([]);
          }
        } else {
          // Handle empty response
          setSkills([]);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching skills:', err);
        setError('Failed to load skills. Please try again later.');
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchSkills();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    setEditingSkill(null);
    setForm({ name: '', level: 'Intermediate', category: '' });
    setShowForm(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({ name: skill.name, level: skill.level, category: skill.category || '' });
    setShowForm(true);
  };

  // Handler for deleting a skill
  const handleDeleteSkill = async (id: number) => {
    try {
      await skillsService.delete(id);
      setSkills(prevSkills => prevSkills.filter(skill => skill.id !== id));
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSkill) {
        // Update existing skill
        const updated = await skillsService.update<Skill>(editingSkill.id, form);
        if (updated) {
          // Safely update the skill in our state
          setSkills(prevSkills => 
            prevSkills.map(s => (s.id === editingSkill.id ? 
              { ...s, ...updated } : // Merge with existing data for safety
              s
            ))
          );
        }
      } else {
        // Create new skill
        const created = await skillsService.create<Skill>(form);
        if (created && typeof created === 'object' && 'id' in created) {
          // Only add if we got a valid skill object back
          setSkills(prevSkills => [...prevSkills, created as Skill]);
        } else {
          throw new Error('Invalid response from server when creating skill');
        }
      }
      
      // Reset form state
      setShowForm(false);
      setEditingSkill(null);
      setForm({ name: '', level: 'Intermediate', category: '' });
      setError(null);
    } catch (err) {
      console.error('Error saving skill:', err);
      setError('Failed to save skill. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Skills</h1>
      
      {!currentUser ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please log in to manage your skills.
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow hover:from-blue-700 hover:to-purple-700"
            >
              Add Skill
            </button>
            {error && (
              <div className="text-red-500 bg-red-100 px-3 py-1 rounded">
                {error}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading skills...</div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              {!Array.isArray(skills) || skills.length === 0 ? (
                <div className="text-gray-500 p-4 text-center">No skills added yet.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(skills) && skills.map(skill => (
                      <tr key={skill.id}>
                        <td className="px-4 py-2">{skill.name}</td>
                        <td className="px-4 py-2">{skill.level}</td>
                        <td className="px-4 py-2">{skill.category || '-'}</td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            onClick={() => handleEditSkill(skill)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Skill Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Skill Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Proficiency Level</label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category (Optional)</label>
                <input
                  type="text"
                  name="category"
                  value={form.category || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSkill(null);
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsPage;