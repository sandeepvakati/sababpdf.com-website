'use client';

import { useMemo, useState } from 'react';
import ToolCard from './ToolCard';
import { TOOL_GROUPS } from '../lib/toolsList';

const FILTERS = [
  { id: 'all', label: 'All tools' },
  { id: 'browser', label: 'Browser tools' },
  { id: 'server', label: 'Server tools' },
  ...TOOL_GROUPS.map((group) => ({
    id: group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: group.name,
    groupName: group.name,
  })),
];

export default function HomeToolsDirectory() {
  const [activeFilter, setActiveFilter] = useState('all');

  const tools = useMemo(
    () =>
      TOOL_GROUPS.flatMap((group) =>
        group.tools.map((tool) => ({
          ...tool,
          groupName: group.name,
        })),
      ),
    [],
  );

  const filteredTools = useMemo(() => {
    if (activeFilter === 'all') {
      return tools;
    }

    if (activeFilter === 'browser') {
      return tools.filter((tool) => tool.processing === 'client');
    }

    if (activeFilter === 'server') {
      return tools.filter((tool) => tool.processing === 'server');
    }

    const selectedGroup = FILTERS.find((filter) => filter.id === activeFilter)?.groupName;
    return selectedGroup ? tools.filter((tool) => tool.groupName === selectedGroup) : tools;
  }, [activeFilter, tools]);

  return (
    <div className="directory-panel">
      <div className="directory-filter-row" role="tablist" aria-label="Filter PDF tools by workflow">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              className={`directory-filter${isActive ? ' directory-filter-active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={isActive}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="directory-toolbar">
        <p className="directory-toolbar-copy">
          Showing {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'} with practical workflow notes and
          transparent file-handling guidance.
        </p>
      </div>

      <div className="tool-grid">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
