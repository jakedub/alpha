# app/services/path_graph.py

import networkx as nx

def build_venue_graph():
    G = nx.Graph()

    G.add_edge("Room401", "Elevator4F", weight=10)
    G.add_edge("Elevator4F", "ElevatorG", weight=35)
    G.add_edge("ElevatorG", "MainLobby", weight=10)
    G.add_edge("MainLobby", "Crosswalk", weight=20)
    G.add_edge("Crosswalk", "LobbyB", weight=30)
    G.add_edge("LobbyB", "ElevatorG_B", weight=10)
    G.add_edge("ElevatorG_B", "ElevatorB1_B", weight=40)
    G.add_edge("ElevatorB1_B", "BasementRoom2", weight=10)

    return G

def compute_shortest_path(G, start: str, end: str):
    path = nx.shortest_path(G, source=start, target=end, weight="weight")
    time = nx.shortest_path_length(G, source=start, target=end, weight="weight")
    return path, time