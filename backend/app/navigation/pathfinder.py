# navigation/pathfinder.py
import heapq
from typing import List, Tuple, Dict
from .models import Waypoint, Connection

class IndoorPathfinder:
    def __init__(self):
        self.waypoints = {}
        self.connections = {}
    
    def load_graph(self, venue_id: int):
        """Load waypoints and connections for a venue."""
        waypoints = Waypoint.objects.filter(floor__venue_id=venue_id).select_related('floor')
        connections = Connection.objects.filter(
            from_waypoint__floor__venue_id=venue_id
        ).select_related('from_waypoint', 'to_waypoint')
        
        self.waypoints = {wp.id: wp for wp in waypoints}
        self.connections = {}
        
        for conn in connections:
            if conn.from_waypoint.id not in self.connections:
                self.connections[conn.from_waypoint.id] = []
            self.connections[conn.from_waypoint.id].append(conn)
    
    def find_path(self, start_waypoint_id: int, end_waypoint_id: int) -> List[Dict]:
        """Find shortest path using A* algorithm."""
        # A* implementation
        heap = [(0, start_waypoint_id, [])]
        visited = set()
        
        while heap:
            cost, current_id, path = heapq.heappop(heap)
            
            if current_id in visited:
                continue
            
            visited.add(current_id)
            path = path + [current_id]
            
            if current_id == end_waypoint_id:
                return self._generate_directions(path)
            
            for connection in self.connections.get(current_id, []):
                if connection.to_waypoint.id not in visited:
                    new_cost = cost + connection.distance_meters
                    heuristic = self._heuristic(connection.to_waypoint.id, end_waypoint_id)
                    heapq.heappush(heap, (new_cost + heuristic, connection.to_waypoint.id, path))
        
        return []
    
    def _heuristic(self, waypoint_id: int, target_id: int) -> float:
        """Simple Euclidean distance heuristic."""
        wp1 = self.waypoints[waypoint_id]
        wp2 = self.waypoints[target_id]
        
        # Handle different floors
        if wp1.floor.id != wp2.floor.id:
            return abs(wp1.floor.level - wp2.floor.level) * 50  # Penalty for floor changes
        
        dx = wp1.x_pixel - wp2.x_pixel
        dy = wp1.y_pixel - wp2.y_pixel
        return ((dx**2 + dy**2)**0.5) * wp1.floor.meters_per_pixel
    
    def _generate_directions(self, waypoint_path: List[int]) -> List[Dict]:
        """Convert waypoint path to human-readable directions."""
        directions = []
        
        for i in range(len(waypoint_path) - 1):
            from_id = waypoint_path[i]
            to_id = waypoint_path[i + 1]
            
            # Find connection
            connection = next(
                (conn for conn in self.connections.get(from_id, []) 
                 if conn.to_waypoint.id == to_id), None
            )
            
            if connection:
                from_wp = self.waypoints[from_id]
                to_wp = self.waypoints[to_id]
                
                directions.append({
                    'step': i + 1,
                    'from': from_wp.name,
                    'to': to_wp.name,
                    'distance': f"{connection.distance_meters:.0f}m",
                    'instruction': connection.instructions or f"Walk to {to_wp.name}",
                    'type': connection.connection_type,
                    'floor_from': from_wp.floor.name,
                    'floor_to': to_wp.floor.name
                })
        
        return directions