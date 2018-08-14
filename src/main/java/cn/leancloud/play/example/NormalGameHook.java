package cn.leancloud.play.example;

import cn.leancloud.play.Log;
import cn.leancloud.play.hook.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Author: ylgrgyq
 * Date: 18/5/30
 */

public class NormalGameHook extends AbstractGameHook {
    @Override
    public void onCreateRoom(CreateRoomContext ctx) {
        CreateRoomRequest req = ctx.getRequest();

        Log.info("on create room {}", req.getPersistentParams());

        req.setEmptyRoomTtl(req.getEmptyRoomTtlSecs() + 1, TimeUnit.SECONDS);
        req.setMaxPlayerCount(req.getMaxPlayerCount() + 1);

        List<String> lobbyKeys = new ArrayList<>();
        lobbyKeys.add("lobby1");
        lobbyKeys.add("lobby2");
        lobbyKeys.add("lobby3");
        lobbyKeys.addAll(req.getLobbyKeys());
        req.setLobbyKeys(lobbyKeys);

        List<String> expectUsers = new ArrayList<>();
        expectUsers.add("user1");
        expectUsers.add("user2");
        expectUsers.add("user3");
        expectUsers.addAll(req.getExpectUsers());
        req.setExpectUsers(expectUsers);

        req.setPlayerTtl(req.getPlayerTtlSecs() + 1, TimeUnit.SECONDS);

        Map<String, Object> props = new HashMap<>();
        props.put("hello", "world");
        props.put("props1", "value1");
        props.put("props2", "value2");
        props.put("props3", "value3");
        props.putAll(req.getRoomProperties());
        req.setRoomProperties(props);

        ctx.continueProcess();
    }

    @Override
    public void onBeforeJoinRoom(BeforeJoinRoomContext ctx) {
        JoinRoomRequest req = ctx.getRequest();

        Log.info("on join room {}", req.getPersistentParams());

        Map<String, Object> expectProps = new HashMap<>();
        expectProps.put("hello", "world");
        expectProps.put("props1", "value1");
        expectProps.put("props2", "value2");
        expectProps.put("props3", "value3");
        expectProps.putAll(req.getExpectedRoomProperties());
        req.setExpectedRoomProperties(expectProps);

        List<String> expectUsers = new ArrayList<>();
        expectUsers.add("friend1");
        expectUsers.addAll(req.getExpectUsers());
        req.setExpectUsers(expectUsers);

        Map<String, Object> actorProps = new HashMap<>();
        actorProps.put("actor-props1", "value1");
        actorProps.put("actor-props2", "value2");
        actorProps.putAll(req.getActorProperties());
        req.setActorProperties(actorProps);

        ctx.continueProcess();
    }

    @Override
    public void onBeforeLeaveRoom(BeforeLeaveRoomContext ctx) {
        LeaveRoomRequest req = ctx.getRequest();
        Log.info("on leave room {}", req.getPersistentParams());

        ctx.continueProcess();
    }

    @Override
    public void onBeforeSetRoomProperties(BeforeSetRoomPropertiesContext ctx) {
        SetRoomPropertiesRequest req = ctx.getRequest();
        Log.info("on set room properties {}", req.getPersistentParams());

        Map<String, Object> expectValues = new HashMap<>();
        expectValues.put("hello", "world");
        expectValues.put("props1", "value1");
        expectValues.put("props2", "value2");
        expectValues.put("props3", "value3");
        expectValues.putAll(req.getExpectedValues());
        req.setExpectedValues(expectValues);

        Map<String, Object> props = new HashMap<>();
        props.put("props4", "value4");
        props.put("props5", "value5");
        props.putAll(req.getProperties());
        req.setProperties(props);

        ctx.continueProcess();
    }

    @Override
    public void onBeforeSetPlayerProperties(BeforeSetPlayerPropertiesContext ctx) {
        SetPlayerPropertiesRequest req = ctx.getRequest();
        Log.info("on set player properties {}", req.getPersistentParams());

        Map<String, Object> expectValues = new HashMap<>();
        expectValues.put("actor-props1", "value1");
        expectValues.put("actor-props2", "value2");
        expectValues.putAll(req.getExpectedValues());
        req.setExpectedValues(expectValues);

        Map<String, Object> props = new HashMap<>();
        props.put("actor-props3", "value3");
        props.put("actor-props4", "value4");
        props.putAll(req.getProperties());
        req.setProperties(props);

        ctx.continueProcess();
    }

    @Override
    public void onBeforeOpenCloseRoom(BeforeOpenCloseRoomContext ctx) {
        OpenCloseRoomRequest req = ctx.getRequest();
        Log.info("on open close room {}", req.getPersistentParams());

        if (req.isCloseRoom()) {
            req.openRoom();
        } else {
            req.closeRoom();
        }

        ctx.continueProcess();
    }

    @Override
    public void onBeforeHideExposeRoom(BeforeHideExposeRoomContext ctx) {
        HideExposeRoomRequest req = ctx.getRequest();
        Log.info("on hide expose room {}", req.getPersistentParams());

        if (req.isHideRoom()) {
            req.exposeRoom();
        } else {
            req.hideRoom();
        }

        ctx.continueProcess();
    }

    @Override
    public void onBeforeRaiseRpc(BeforeRaiseRpcContext ctx) {
        RaiseRpcRequest req = ctx.getRequest();
        Log.info("on raise rpc {}", req.getPersistentParams());

        Object data = req.getData();
        if (data instanceof String) {
            req.setData(data + "modified-by-hook");
        }

        List<Integer> actors = req.getToActorIds();
        if (actors.size() > 0) {
            actors.remove(actors.size() - 1);
            req.setToActorIds(actors);
        }

        ReceiverGroup group = req.getReceiverGroup();
        if (group != null) {
            if (group == ReceiverGroup.MASTER) {
                req.setReceiverGroup(ReceiverGroup.OTHERS);
            } else {
                req.setReceiverGroup(ReceiverGroup.MASTER);
            }
        }

        CacheOption opt = req.getCacheOption();
        if (opt != null) {
            if (opt == CacheOption.CACHE_ON_ACTOR) {
                req.setCacheOption(CacheOption.CACHE_ON_ROOM);
            } else {
                req.setCacheOption(CacheOption.CACHE_ON_ACTOR);
            }
        }

        ctx.continueProcess();
    }

    @Override
    public void onCloseRoom(CloseRoomContext ctx) {
        CloseRoomRequest req = ctx.getRequest();
        Log.info("on close room {}", req.getPersistentParams());

        ctx.continueProcess();
    }
}
