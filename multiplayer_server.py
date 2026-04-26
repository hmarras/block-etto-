#!/usr/bin/env python3
"""
Block-etto Multiplayer WebSocket Server
Deploy su Render.com: WebSocket only (static files serviti da GitHub Pages)
"""
import asyncio
import websockets
import json
import random
import string
import os

rooms = {}  # code → {players, names, scores, done, rematch}


def make_room_code():
    return ''.join(random.choices(string.ascii_uppercase, k=4))


def reset_room(room):
    room['scores'] = [None, None]
    room['done'] = [False, False]
    room['rematch'] = [False, False]


async def ws_handler(websocket):
    player_index = None
    room_code = None

    try:
        async for raw in websocket:
            msg = json.loads(raw)

            if msg['type'] == 'create_room':
                room_code = make_room_code()
                while room_code in rooms:
                    room_code = make_room_code()

                name = msg.get('name', 'Giocatore 1')
                rooms[room_code] = {
                    'players': [websocket, None],
                    'names': [name, None],
                    'scores': [None, None],
                    'done': [False, False],
                    'rematch': [False, False],
                }
                player_index = 0

                await websocket.send(json.dumps({
                    'type': 'room_created',
                    'room': room_code,
                }))

            elif msg['type'] == 'join_room':
                room_code = msg.get('room', '').strip().upper()
                name = msg.get('name', 'Giocatore 2')

                if room_code not in rooms:
                    await websocket.send(json.dumps({'type': 'error', 'message': 'Stanza non trovata'}))
                    continue

                room = rooms[room_code]
                if room['players'][1] is not None:
                    await websocket.send(json.dumps({'type': 'error', 'message': 'Stanza piena'}))
                    continue

                room['players'][1] = websocket
                room['names'][1] = name
                player_index = 1

                await websocket.send(json.dumps({
                    'type': 'joined',
                    'opponent_name': room['names'][0],
                }))
                await room['players'][0].send(json.dumps({
                    'type': 'opponent_joined',
                    'opponent_name': name,
                }))

                start = json.dumps({'type': 'game_start'})
                await room['players'][0].send(start)
                await room['players'][1].send(start)

            elif msg['type'] == 'score_update':
                if room_code in rooms:
                    room = rooms[room_code]
                    room['scores'][player_index] = msg['score']
                    opp_idx = 1 - player_index
                    opp_ws = room['players'][opp_idx]
                    if opp_ws:
                        await opp_ws.send(json.dumps({
                            'type': 'opponent_score',
                            'score': msg['score'],
                        }))

            elif msg['type'] == 'game_over':
                if room_code in rooms:
                    room = rooms[room_code]
                    room['scores'][player_index] = msg['score']
                    room['done'][player_index] = True

                    opp_idx = 1 - player_index
                    opp_ws = room['players'][opp_idx]
                    if opp_ws:
                        await opp_ws.send(json.dumps({
                            'type': 'opponent_game_over',
                            'score': msg['score'],
                        }))

                    if all(room['done']):
                        await _send_results(room)

            elif msg['type'] == 'rematch_request':
                if room_code in rooms:
                    room = rooms[room_code]
                    room['rematch'][player_index] = True

                    opp_idx = 1 - player_index
                    opp_ws = room['players'][opp_idx]
                    if opp_ws:
                        await opp_ws.send(json.dumps({'type': 'rematch_requested'}))

                    if all(room['rematch']):
                        reset_room(room)
                        start = json.dumps({'type': 'game_start'})
                        await room['players'][0].send(start)
                        await room['players'][1].send(start)

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        print(f"WS error: {e}")
    finally:
        if room_code and room_code in rooms:
            room = rooms[room_code]
            opp_idx = 1 - player_index if player_index is not None else None
            if opp_idx is not None:
                opp_ws = room['players'][opp_idx]
                if opp_ws:
                    try:
                        await opp_ws.send(json.dumps({'type': 'opponent_disconnected'}))
                    except Exception:
                        pass
            del rooms[room_code]


async def _send_results(room):
    s0, s1 = room['scores']
    s0 = s0 or 0
    s1 = s1 or 0
    for i, player_ws in enumerate(room['players']):
        if player_ws:
            try:
                await player_ws.send(json.dumps({
                    'type': 'result',
                    'you_won': room['scores'][i] > room['scores'][1 - i],
                    'draw': s0 == s1,
                    'your_score': room['scores'][i],
                    'opponent_score': room['scores'][1 - i],
                    'your_name': room['names'][i],
                    'opponent_name': room['names'][1 - i],
                }))
            except Exception:
                pass


async def main():
    port = int(os.environ.get('PORT', 8765))
    print(f"Block-etto WebSocket server avviato su porta {port}")
    async with websockets.serve(ws_handler, '0.0.0.0', port, ping_interval=30, ping_timeout=10):
        await asyncio.Future()


asyncio.run(main())
