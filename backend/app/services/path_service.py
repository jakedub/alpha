import networkx as nx

from app.models.location import Location

def build_graph_from_db(db: Session):
    G = nx.Graph()

    connections = db.query(RoomConnection).all()
    for conn in connections:
        from_room = conn.from_room.name
        to_room = conn.to_room.name
        G.add_edge(from_room, to_room, weight=conn.travel_time)

    return G