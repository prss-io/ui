import React from 'react';
import { Card } from '../_common/components/ui/card';
import { Badge } from '../_common/components/ui/badge';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface TimelineBlockProps {
  fields: {
    title?: string;
    description?: string;
    events?: string | TimelineEvent[]; // Can be JSON string or array
    timelineOrientation?: 'vertical' | 'horizontal';
    accentColor?: string;
    groupBy?: 'year' | 'month' | 'none';
  };
}

const TimelineBlock: React.FC<TimelineBlockProps> = ({ fields }) => {
  const {
    title,
    description,
    events: eventsData = [],
    timelineOrientation = 'vertical',
    accentColor = '#3b82f6',
    groupBy = 'year'
  } = fields;

  // Parse events if it's a JSON string
  let events: TimelineEvent[] = [];
  try {
    if (typeof eventsData === 'string') {
      events = JSON.parse(eventsData);
    } else if (Array.isArray(eventsData)) {
      events = eventsData;
    }
  } catch (error) {
    console.error('Failed to parse timeline events:', error);
    events = [];
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No timeline events to display.</p>
      </div>
    );
  }

  // Group events by period (year, month, or none)
  const eventsByPeriod: { [key: string]: TimelineEvent[] } = {};
  
  events.forEach((event) => {
    let periodKey = 'Events';
    
    if (groupBy === 'year' && event.date) {
      const year = new Date(event.date).getFullYear();
      periodKey = isNaN(year) ? 'Unknown' : year.toString();
    } else if (groupBy === 'month' && event.date) {
      const date = new Date(event.date);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'long' });
      periodKey = isNaN(year) ? 'Unknown' : `${month} ${year}`;
    }
    
    if (!eventsByPeriod[periodKey]) {
      eventsByPeriod[periodKey] = [];
    }
    eventsByPeriod[periodKey].push(event);
  });

  // Sort periods chronologically
  const sortedPeriods = Object.keys(eventsByPeriod).sort((a, b) => {
    if (a === 'Unknown' || a === 'Events') return 1;
    if (b === 'Unknown' || b === 'Events') return -1;
    
    if (groupBy === 'year') {
      return parseInt(b) - parseInt(a); // Newest first
    } else if (groupBy === 'month') {
      return new Date(b).getTime() - new Date(a).getTime();
    }
    
    return a.localeCompare(b);
  });

  // Horizontal timeline layout
  if (timelineOrientation === 'horizontal') {
    return (
      <div className="py-8">
        {title && <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>}
        {description && <p className="text-lg text-muted-foreground text-center mb-8">{description}</p>}
        
        <div className="overflow-x-auto">
          <div className="flex space-x-6 pb-4" style={{ minWidth: `${events.length * 300}px` }}>
            {events.map((event, index) => (
              <Card key={index} className="flex-shrink-0 w-72">
                <div className="p-6">
                  <div className="space-y-3">
                    <Badge variant="outline">
                      {event.date}
                    </Badge>
                    <h4 className="text-lg font-semibold">
                      {event.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {event.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vertical timeline (default) - inspired by blog layout
  return (
    <div className="py-8">
      {title && <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>}
      {description && <p className="text-lg text-muted-foreground text-center mb-8">{description}</p>}
      
      <div className="">
        <div className="relative">
          {/* Continuous vertical line */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-current opacity-20"
            style={{ backgroundColor: accentColor }}
          />
          
          <div className="">
            {sortedPeriods.map((period) => (
              <div key={period} className="2">
                <div className="space-y-6">
                  {eventsByPeriod[period].map((event, index) => (
                    <Card
                      key={index}
                      className="border-0 bg-transparent shadow-none"
                      style={{ marginBottom: "0px" }}
                    >
                      <div 
                        className="border-l-[2px] py-4 pt-6 px-6 relative"
                        style={{ borderColor: accentColor }}
                      >
                        {/* Timeline dot */}
                        <div 
                          className="absolute left-0 top-8 w-3 h-3 rounded-full transform -translate-x-1/2"
                          style={{ backgroundColor: accentColor }}
                        />
                        
                        <div className="space-y-3">
                          <Badge variant="outline">
                            {event.date}
                          </Badge>
                          <h4 className="text-xl font-semibold md:text-2xl">
                            {event.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineBlock;
