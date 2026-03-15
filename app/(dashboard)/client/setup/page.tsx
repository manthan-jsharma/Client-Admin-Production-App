'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { SetupItem } from '@/lib/types';

export default function SetupPage() {
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSetupItems = async () => {
      try {
        const response = await fetch('/api/setup-items', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setSetupItems(result.data);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch setup items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupItems();
  }, []);

  const completedCount = setupItems.filter(item => item.completed).length;
  const progressPercentage = setupItems.length > 0 ? (completedCount / setupItems.length) * 100 : 0;

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ completed: !completed })
      });
      const result = await response.json();
      if (result.success) {
        setSetupItems(setupItems.map(item =>
          item._id === itemId ? { ...item, completed: !completed } : item
        ));
      }
    } catch (error) {
      console.error('[v0] Failed to update setup item:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Project Setup</h1>
        <p className="text-slate-400">Complete these items to get your project started</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="bg-slate-800 border-slate-700 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Setup Progress</h2>
                  <p className="text-slate-400">{completedCount} of {setupItems.length} items completed</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-400">{Math.round(progressPercentage)}%</div>
                </div>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </Card>

            {/* Setup Items List */}
            <div className="space-y-4">
              {setupItems.length > 0 ? (
                setupItems.map((item) => (
                  <Card
                    key={item._id}
                    className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleItem(item._id!, item.completed)}
                        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {item.completed && <span className="text-white text-sm">✓</span>}
                      </button>

                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {item.itemNumber}. {item.title}
                        </h3>
                        {item.value && (
                          <p className="text-slate-400 text-sm mt-1">{item.value}</p>
                        )}
                        {item.completedAt && (
                          <p className="text-xs text-green-400 mt-2">
                            ✓ Completed on {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {item.completed ? (
                        <span className="flex-shrink-0 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                          Done
                        </span>
                      ) : (
                        <span className="flex-shrink-0 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-2">No setup items yet</p>
                  <p className="text-sm text-slate-500">Your admin will create setup items for your project</p>
                </Card>
              )}
            </div>

            {/* Tips Section */}
            <Card className="bg-slate-800 border-slate-700 p-6 mt-8">
              <h3 className="text-lg font-bold text-white mb-4">💡 Setup Tips</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>• Gather all required documents and files before starting</li>
                <li>• Complete items in order for optimal project flow</li>
                <li>• Reach out if you need clarification on any item</li>
                <li>• Mark items complete as you finish them</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
