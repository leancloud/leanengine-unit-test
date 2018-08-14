package cn.leancloud.play.example;

import cn.leancloud.play.hook.*;
import com.alibaba.fastjson.JSONObject;

import java.util.List;

public class RpcAsControllerHook extends AbstractGameHook {
    private HookRoom hookRoom;

    public RpcAsControllerHook(HookRoom hookRoom) {
        this.hookRoom = hookRoom;
    }

    @Override
    public void onBeforeRaiseRpc(BeforeRaiseRpcContext ctx) {
        RaiseRpcRequest req = ctx.getRequest();

        switch (req.getEventId()) {
            case 1:
                ctx.continueProcess();
                hookRoom.closeRoom();
                break;
            case 2:
                ctx.continueProcess();
                hookRoom.openRoom();
                break;
            case 3:
                ctx.continueProcess();
                hookRoom.hideRoom();
                break;
            case 4:
                ctx.continueProcess();
                hookRoom.exposeRoom();
                break;
            case 5: {
                ctx.continueProcess();
                String data = (String) req.getData();
                JSONObject obj = JSONObject.parseObject(data);
                JSONObject props = obj.getJSONObject("properties");
                JSONObject expect = obj.getJSONObject("expect");

                hookRoom.updateRoomProperty(props.getInnerMap(),
                        expect == null ? null : expect.getInnerMap());
                break;
            }
            case 6: {
                ctx.continueProcess();
                String data = (String) req.getData();
                JSONObject obj = JSONObject.parseObject(data);
                int target = obj.getInteger("targetActorId");
                JSONObject props = obj.getJSONObject("properties");
                JSONObject expect = obj.getJSONObject("expect");

                hookRoom.updatePlayerProperty(target, props,
                        expect == null ? null : expect.getInnerMap());
                break;
            }
            case 7: {
                ctx.skipProcess();
                String data = (String) req.getData();
                JSONObject obj = JSONObject.parseObject(data);
                List<Integer> targetList = obj.getJSONArray("targetActors").toJavaList(Integer.class);
                String msg = obj.getString("data");
                List<Actor> targetActors = hookRoom.getActorByIds(targetList);
                int from = hookRoom.getAllActors().get(0).getActorId();

                RaiseRpcOptions opt = new RaiseRpcOptions.RaiseRpcOptionsBuilder()
                        .withCacheOption(CacheOption.CACHE_ON_ROOM)
                        .withEventId(666)
                        .build();

                hookRoom.raiseRpcToActors(targetActors, from, msg, opt);
                break;
            }
            case 8: {
                ctx.continueProcess();
                String data = (String) req.getData();
                JSONObject obj = JSONObject.parseObject(data);
                String receiverStr = obj.getString("receiver");
                String msg = obj.getString("data");
                ReceiverGroup group = ReceiverGroup.OTHERS;
                if ("master".equals(receiverStr)) {
                    group = ReceiverGroup.MASTER;
                } else if ("all".equals(receiverStr)) {
                    group = ReceiverGroup.ALL;
                }

                List<Actor> targetActors = hookRoom.getAllActors();
                int from = targetActors.get(targetActors.size() - 1).getActorId();

                RaiseRpcOptions opt = new RaiseRpcOptions.RaiseRpcOptionsBuilder()
                        .withCacheOption(CacheOption.CACHE_ON_ROOM)
                        .withEventId(666)
                        .build();
                hookRoom.raiseRpcToReceiverGroup(group, from, msg, opt);
                break;
            }
            case 9: {
                ctx.continueProcess();
                String actorId = (String) req.getData();
                int id = Integer.valueOf(actorId);
                hookRoom.removeActor(id);
                break;
            }
        }
    }
}
