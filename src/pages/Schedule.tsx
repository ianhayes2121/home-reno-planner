
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Task } from "@/types";
import { Calendar } from "lucide-react";
import { format, addDays, eachDayOfInterval, parseISO, isValid } from "date-fns";

const Schedule: React.FC = () => {
  const { project } = useProject();
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
  
  // Generate calendar days between start and end date
  useEffect(() => {
    if (project?.tasks && project.tasks.length > 0) {
      let earliest = new Date();
      let latest = addDays(new Date(), 30);
      
      project.tasks.forEach(task => {
        if (task.startDate && isValid(parseISO(task.startDate))) {
          const taskStart = parseISO(task.startDate);
          if (taskStart < earliest) {
            earliest = taskStart;
          }
        }
        
        if (task.endDate && isValid(parseISO(task.endDate))) {
          const taskEnd = parseISO(task.endDate);
          if (taskEnd > latest) {
            latest = taskEnd;
          }
        } else if (task.startDate && isValid(parseISO(task.startDate)) && task.duration) {
          const taskEnd = addDays(parseISO(task.startDate), task.duration);
          if (taskEnd > latest) {
            latest = taskEnd;
          }
        }
      });
      
      setStartDate(earliest);
      setEndDate(latest);
    }
  }, [project?.tasks]);
  
  useEffect(() => {
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    setCalendarDays(days);
  }, [startDate, endDate]);
  
  // Function to calculate task position and duration for visualization
  const getTaskScheduleData = (task: Task) => {
    if (!task.startDate) {
      return null;
    }
    
    const taskStartDate = parseISO(task.startDate);
    if (!isValid(taskStartDate)) {
      return null;
    }
    
    // Calculate where this task should be positioned in our calendar view
    const dayIndex = calendarDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === format(taskStartDate, 'yyyy-MM-dd')
    );
    
    if (dayIndex === -1) {
      return null;
    }
    
    return {
      startDayIndex: dayIndex,
      durationDays: task.duration || 1,
      status: task.status,
    };
  };
  
  // Get tasks that have start dates for visualization
  const scheduledTasks = project?.tasks
    .filter(task => task.startDate)
    .map(task => ({
      ...task,
      scheduleData: getTaskScheduleData(task),
    }))
    .filter(task => task.scheduleData !== null) || [];
  
  const statusColors = {
    "not-started": "bg-gray-200 border-gray-300 text-gray-700",
    "in-progress": "bg-blue-100 border-blue-300 text-blue-700",
    "completed": "bg-green-100 border-green-300 text-green-700",
  };
  
  if (!project) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 mt-1">
            Timeline view of your renovation tasks
          </p>
        </div>
      </div>
      
      {calendarDays.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Days header */}
            <div className="flex border-b border-gray-200 pb-2">
              <div className="w-48 flex-shrink-0 pr-4 font-medium">Task</div>
              <div className="flex-1 flex">
                {calendarDays.map((day, index) => (
                  <div 
                    key={format(day, 'yyyy-MM-dd')} 
                    className={`w-8 text-center text-xs ${
                      format(day, 'MM-dd') === format(new Date(), 'MM-dd') 
                        ? 'bg-blue-100 rounded' 
                        : ''
                    } ${
                      format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun'
                        ? 'text-gray-400'
                        : ''
                    }`}
                  >
                    <div>{format(day, 'd')}</div>
                    <div>{format(day, 'E')}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Task rows */}
            {scheduledTasks.length > 0 ? (
              <div className="mt-4 space-y-4">
                {scheduledTasks.map(task => (
                  <div key={task.id} className="flex items-center">
                    <div className="w-48 flex-shrink-0 pr-4 font-medium truncate" title={task.title}>
                      {task.title}
                    </div>
                    <div className="flex-1 flex items-center relative">
                      {/* Empty space before task starts */}
                      <div 
                        className="h-8" 
                        style={{ width: `${task.scheduleData!.startDayIndex * 32}px` }}
                      ></div>
                      
                      {/* Task bar */}
                      <div 
                        className={`h-8 rounded px-2 flex items-center border ${
                          statusColors[task.status]
                        }`}
                        style={{ 
                          width: `${task.scheduleData!.durationDays * 32}px`,
                          minWidth: '64px',
                        }}
                      >
                        <span className="truncate text-sm">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No scheduled tasks found. Add start dates to your tasks to see them on the timeline.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gray-100 p-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Scheduled Tasks</h2>
          <p className="text-gray-500">
            Add start dates to your tasks to visualize them on the schedule.
          </p>
        </Card>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Legend</h2>
        <div className="flex gap-4">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded mr-2 ${statusColors["not-started"]}`}></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded mr-2 ${statusColors["in-progress"]}`}></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded mr-2 ${statusColors["completed"]}`}></div>
            <span>Completed</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
