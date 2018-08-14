package cn.leancloud.play.example;

import cn.leancloud.play.Log;
import cn.leancloud.play.hook.GameHook;
import cn.leancloud.play.hook.HookFactory;
import cn.leancloud.play.hook.HookRoom;

import java.util.Map;

/**
 * Author: ylgrgyq
 * Date: 18/5/30
 */
public class MyHookFactory implements HookFactory {
    @Override
    public GameHook create(HookRoom room, String hookName, Map<String, String> initConfigs) {
        Log.info("room name: {}", room.getRoomName());
        Log.info("ep ttl: {}", room.getEmptyRoomTtlSecs());
        Log.info("expect users: {}", room.getExpectUsers());
        Log.info("lobby keys: {}", room.getLobbyKeys());
        Log.info("max members: {}", room.getMaxPlayerCount());
        Log.info("player ttl: {}", room.getPlayerTtlSecs());
        Log.info("master client: {}", room.getMasterUserId());
        Log.info("actors: {}", room.getAllActors());
        Log.info("room props: {}", room.getRoomProperties());

        if (hookName != null && hookName.length() > 0) {
            switch (hookName) {
                case "reject_create_room":
                    return new RejectCreateRoomHook();
                case "normal":
                    return new NormalGameHook();
                case "reject_all_room_op":
                    return new RejectAllRoomOpHook();
                case "reject_join_room":
                    return new RejectJoinRoomHook();
                case "rpc_as_controller":
                    return new RpcAsControllerHook(room);
            }
        }

        return new DoNothingHook();
    }
}
