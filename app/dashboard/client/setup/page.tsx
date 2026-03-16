'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { SetupItem } from '@/lib/types';
import {
  Settings2,
  CheckCircle2,
  Clock,
  Lightbulb,
  Check,
} from 'lucide-react';

export default function SetupPage() {
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSetupItems = async () => {
      try {
        const response = await fetch('/api/setup-items', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success) setSetupItems(result.data);
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

  const tips = [
    'Gather all required documents and files before starting',
    'Complete items in order for optimal project flow',
    'Reach out via chat if you need clarification on any item',
    'Mark items complete as you finish them',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Project Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Complete these items to get your project started</p>
      </div>

      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="bg-slate-800/60 border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Setup Progress</h2>
                  <p className="text-sm text-slate-500">{completedCount} of {setupItems.length} items completed</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${progressPercentage === 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {Math.round(progressPercentage)}%
                  </div>
                  {progressPercentage === 100 && (
                    <p className="text-xs text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Complete!
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progressPercentage === 100
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : 'bg-gradient-to-r from-blue-600 to-blue-400'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </Card>

            {/* Setup Items */}
            <div className="space-y-3">
              {setupItems.length > 0 ? (
                setupItems.map((item, index) => (
                  <Card
                    key={item._id}
                    className={`border transition-all ${
                      item.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-4">
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleToggleItem(item._id!, item.completed)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            item.completed
                              ? 'bg-emerald-500 hover:bg-emerald-400'
                              : 'bg-slate-700 border-2 border-slate-600 hover:border-blue-500'
                          }`}
                        >
                          {item.completed ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                          )}
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold mb-0.5 ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {item.title}
                        </h3>
                        {item.value && (
                          <p className="text-xs text-slate-500">{item.value}</p>
                        )}
                        {item.completedAt && (
                          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {item.completed ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs rounded-full font-medium">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
                  <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Settings2 className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium mb-1.5">No setup items yet</p>
                  <p className="text-slate-600 text-sm">Your admin will create setup items for your project</p>
                </Card>
              )}
            </div>

            {/* Tips Section */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Setup Tips</h3>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
