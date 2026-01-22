import React, { useState } from 'react';
import Notes from './Notes';
import Assignments from './Assignments';
import Exams from './Exams';
import Syllabus from './Syllabus';

export default function Academic() {
  const [activeTab, setActiveTab] = useState('notes');

  const tabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'exams', label: 'Exams' },
    { id: 'syllabus', label: 'Past Papers / Syllabus' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-700 uppercase">Academic Management</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-soft p-6 min-h-[400px]">
        {activeTab === 'notes' && <Notes />}
        {activeTab === 'assignments' && <Assignments />}
        {activeTab === 'exams' && <Exams />}
        {activeTab === 'syllabus' && <Syllabus />}
      </div>
    </div>
  );
}
