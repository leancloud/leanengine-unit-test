package cn.leancloud.play.example;

import cn.leancloud.play.Log;
import cn.leancloud.play.Reason;
import cn.leancloud.play.hook.AbstractGameHook;
import cn.leancloud.play.hook.CreateRoomContext;
import cn.leancloud.play.hook.CreateRoomRequest;

public class RejectCreateRoomHook extends AbstractGameHook {
    @Override
    public void onCreateRoom(CreateRoomContext ctx) {
        CreateRoomRequest req = ctx.getRequest();

        Log.info("reject create room with params: \n" +
                "name: {}\n" +
                "empty room ttl: {}\n" +
                "expect users: {}\n" +
                "lobby keys: {}\n" +
                "max members: {}\n" +
                "player ttl: {}\n" +
                "room properties: {}\n", req.getRoomName(), req.getEmptyRoomTtlSecs(), req.getExpectUsers(),
                req.getLobbyKeys(), req.getMaxPlayerCount(), req.getPlayerTtlSecs(), req.getRoomProperties());

        ctx.rejectProcess(Reason.of(666, "reject create room"));
    }
}
