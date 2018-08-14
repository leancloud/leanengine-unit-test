package cn.leancloud.play.example;

import cn.leancloud.play.Log;
import cn.leancloud.play.Reason;
import cn.leancloud.play.hook.*;

public class RejectJoinRoomHook extends AbstractGameHook {
    private final Reason rejectReason = Reason.of(666, "do not join");
    
    @Override
    public void onCreateRoom(CreateRoomContext ctx) {
        CreateRoomRequest req = ctx.getRequest();

        Log.info("on create room {}", req.getPersistentParams());

        ctx.continueProcess();
    }

    @Override
    public void onBeforeJoinRoom(BeforeJoinRoomContext ctx) {
        JoinRoomRequest req = ctx.getRequest();

        Log.info("on join room {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }
}


