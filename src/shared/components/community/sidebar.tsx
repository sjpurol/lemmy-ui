import { None, Option, Some } from "@sniptt/monads";
import { Component, linkEvent } from "inferno";
import { Link } from "inferno-router";
import {
  AddModToCommunity,
  BlockCommunity,
  CommunityModeratorView,
  CommunityView,
  DeleteCommunity,
  FollowCommunity,
  PersonViewSafe,
  PurgeCommunity,
  RemoveCommunity,
  SubscribedType,
  toUndefined,
} from "lemmy-js-client";
import { i18n } from "../../i18next";
import { UserService, WebSocketService } from "../../services";
import {
  amAdmin,
  amMod,
  amTopMod,
  auth,
  getUnixTime,
  mdToHtml,
  numToSI,
  wsClient,
} from "../../utils";
import { BannerIconHeader } from "../common/banner-icon-header";
import { Icon, PurgeWarning, Spinner } from "../common/icon";
import { CommunityForm } from "../community/community-form";
import { CommunityLink } from "../community/community-link";
import { PersonListing } from "../person/person-listing";

interface SidebarProps {
  community_view: CommunityView;
  moderators: CommunityModeratorView[];
  admins: PersonViewSafe[];
  online: number;
  enableNsfw?: boolean;
  showIcon?: boolean;
}

interface SidebarState {
  removeReason: Option<string>;
  removeExpires: Option<string>;
  showEdit: boolean;
  showRemoveDialog: boolean;
  showPurgeDialog: boolean;
  purgeReason: Option<string>;
  purgeLoading: boolean;
  showConfirmLeaveModTeam: boolean;
}

export class Sidebar extends Component<SidebarProps, SidebarState> {
  private emptyState: SidebarState = {
    showEdit: false,
    showRemoveDialog: false,
    removeReason: None,
    removeExpires: None,
    showPurgeDialog: false,
    purgeReason: None,
    purgeLoading: false,
    showConfirmLeaveModTeam: false,
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.state = this.emptyState;
    this.handleEditCommunity = this.handleEditCommunity.bind(this);
    this.handleEditCancel = this.handleEditCancel.bind(this);
  }

  render() {
    return (
      <div>
        {!this.state.showEdit ? (
          this.sidebar()
        ) : (
          <CommunityForm
            community_view={Some(this.props.community_view)}
            onEdit={this.handleEditCommunity}
            onCancel={this.handleEditCancel}
            enableNsfw={this.props.enableNsfw}
          />
        )}
      </div>
    );
  }

  sidebar() {
    return (
      <div>
        <div className="card border-secondary mb-3">
          <div className="card-body">
            {this.communityTitle()}
            {this.adminButtons()}
            {this.subscribe()}
            {this.canPost && this.createPost()}
            {this.blockCommunity()}
          </div>
        </div>
        <div className="card border-secondary mb-3">
          <div className="card-body">
            {this.description()}
            {this.badges()}
            {this.mods()}
          </div>
        </div>
      </div>
    );
  }

  communityTitle() {
    let community = this.props.community_view.community;
    let subscribed = this.props.community_view.subscribed;
    return (
      <div>
        <h5 className="mb-0">
          {this.props.showIcon && (
            <BannerIconHeader icon={community.icon} banner={community.banner} />
          )}
          <span className="mr-2">{community.title}</span>
          {subscribed == SubscribedType.Subscribed && (
            <button
              className="btn btn-secondary btn-sm mr-2"
              onClick={linkEvent(this, this.handleUnsubscribe)}
            >
              <Icon icon="check" classes="icon-inline text-success mr-1" />
              {i18n.t("joined")}
            </button>
          )}
          {subscribed == SubscribedType.Pending && (
            <button
              className="btn btn-warning mr-2"
              onClick={linkEvent(this, this.handleUnsubscribe)}
            >
              {i18n.t("subscribe_pending")}
            </button>
          )}
          {community.removed && (
            <small className="mr-2 text-muted font-italic">
              {i18n.t("removed")}
            </small>
          )}
          {community.deleted && (
            <small className="mr-2 text-muted font-italic">
              {i18n.t("deleted")}
            </small>
          )}
          {community.nsfw && (
            <small className="mr-2 text-muted font-italic">
              {i18n.t("nsfw")}
            </small>
          )}
        </h5>
        <CommunityLink
          community={community}
          realLink
          useApubName
          muted
          hideAvatar
        />
      </div>
    );
  }

  badges() {
    let community_view = this.props.community_view;
    let counts = community_view.counts;
    return (
      <ul className="my-1 list-inline">
        <li className="list-inline-item badge badge-secondary">
          {i18n.t("number_online", {
            count: this.props.online,
            formattedCount: numToSI(this.props.online),
          })}
        </li>
        <li
          className="list-inline-item badge badge-secondary pointer"
          data-tippy-content={i18n.t("active_users_in_the_last_day", {
            count: counts.users_active_day,
            formattedCount: counts.users_active_day,
          })}
        >
          {i18n.t("number_of_users", {
            count: counts.users_active_day,
            formattedCount: numToSI(counts.users_active_day),
          })}{" "}
          / {i18n.t("day")}
        </li>
        <li
          className="list-inline-item badge badge-secondary pointer"
          data-tippy-content={i18n.t("active_users_in_the_last_week", {
            count: counts.users_active_week,
            formattedCount: counts.users_active_week,
          })}
        >
          {i18n.t("number_of_users", {
            count: counts.users_active_week,
            formattedCount: numToSI(counts.users_active_week),
          })}{" "}
          / {i18n.t("week")}
        </li>
        <li
          className="list-inline-item badge badge-secondary pointer"
          data-tippy-content={i18n.t("active_users_in_the_last_month", {
            count: counts.users_active_month,
            formattedCount: counts.users_active_month,
          })}
        >
          {i18n.t("number_of_users", {
            count: counts.users_active_month,
            formattedCount: numToSI(counts.users_active_month),
          })}{" "}
          / {i18n.t("month")}
        </li>
        <li
          className="list-inline-item badge badge-secondary pointer"
          data-tippy-content={i18n.t("active_users_in_the_last_six_months", {
            count: counts.users_active_half_year,
            formattedCount: counts.users_active_half_year,
          })}
        >
          {i18n.t("number_of_users", {
            count: counts.users_active_half_year,
            formattedCount: numToSI(counts.users_active_half_year),
          })}{" "}
          / {i18n.t("number_of_months", { count: 6, formattedCount: 6 })}
        </li>
        <li className="list-inline-item badge badge-secondary">
          {i18n.t("number_of_subscribers", {
            count: counts.subscribers,
            formattedCount: numToSI(counts.subscribers),
          })}
        </li>
        <li className="list-inline-item badge badge-secondary">
          {i18n.t("number_of_posts", {
            count: counts.posts,
            formattedCount: numToSI(counts.posts),
          })}
        </li>
        <li className="list-inline-item badge badge-secondary">
          {i18n.t("number_of_comments", {
            count: counts.comments,
            formattedCount: numToSI(counts.comments),
          })}
        </li>
        <li className="list-inline-item">
          <Link
            className="badge badge-primary"
            to={`/modlog/community/${this.props.community_view.community.id}`}
          >
            {i18n.t("modlog")}
          </Link>
        </li>
      </ul>
    );
  }

  mods() {
    return (
      <ul className="list-inline small">
        <li className="list-inline-item">{i18n.t("mods")}: </li>
        {this.props.moderators.map(mod => (
          <li key={mod.moderator.id} className="list-inline-item">
            <PersonListing person={mod.moderator} />
          </li>
        ))}
      </ul>
    );
  }

  createPost() {
    let cv = this.props.community_view;
    return (
      <Link
        className={`btn btn-secondary btn-block mb-2 ${
          cv.community.deleted || cv.community.removed ? "no-click" : ""
        }`}
        to={`/create_post?community_id=${cv.community.id}`}
      >
        {i18n.t("create_a_post")}
      </Link>
    );
  }

  subscribe() {
    let community_view = this.props.community_view;
    return (
      <div className="mb-2">
        {community_view.subscribed == SubscribedType.NotSubscribed && (
          <button
            className="btn btn-secondary btn-block"
            onClick={linkEvent(this, this.handleSubscribe)}
          >
            {i18n.t("subscribe")}
          </button>
        )}
      </div>
    );
  }

  blockCommunity() {
    let community_view = this.props.community_view;
    let blocked = this.props.community_view.blocked;

    return (
      <div className="mb-2">
        {community_view.subscribed == SubscribedType.NotSubscribed &&
          (blocked ? (
            <button
              className="btn btn-danger btn-block"
              onClick={linkEvent(this, this.handleUnblock)}
            >
              {i18n.t("unblock_community")}
            </button>
          ) : (
            <button
              className="btn btn-danger btn-block"
              onClick={linkEvent(this, this.handleBlock)}
            >
              {i18n.t("block_community")}
            </button>
          ))}
      </div>
    );
  }

  description() {
    let description = this.props.community_view.community.description;
    return description.match({
      some: desc => (
        <div className="md-div" dangerouslySetInnerHTML={mdToHtml(desc)} />
      ),
      none: <></>,
    });
  }

  adminButtons() {
    let community_view = this.props.community_view;
    return (
      <>
        <ul className="list-inline mb-1 text-muted font-weight-bold">
          {amMod(Some(this.props.moderators)) && (
            <>
              <li className="list-inline-item-action">
                <button
                  className="btn btn-link text-muted d-inline-block"
                  onClick={linkEvent(this, this.handleEditClick)}
                  data-tippy-content={i18n.t("edit")}
                  aria-label={i18n.t("edit")}
                >
                  <Icon icon="edit" classes="icon-inline" />
                </button>
              </li>
              {!amTopMod(Some(this.props.moderators)) &&
                (!this.state.showConfirmLeaveModTeam ? (
                  <li className="list-inline-item-action">
                    <button
                      className="btn btn-link text-muted d-inline-block"
                      onClick={linkEvent(
                        this,
                        this.handleShowConfirmLeaveModTeamClick
                      )}
                    >
                      {i18n.t("leave_mod_team")}
                    </button>
                  </li>
                ) : (
                  <>
                    <li className="list-inline-item-action">
                      {i18n.t("are_you_sure")}
                    </li>
                    <li className="list-inline-item-action">
                      <button
                        className="btn btn-link text-muted d-inline-block"
                        onClick={linkEvent(this, this.handleLeaveModTeamClick)}
                      >
                        {i18n.t("yes")}
                      </button>
                    </li>
                    <li className="list-inline-item-action">
                      <button
                        className="btn btn-link text-muted d-inline-block"
                        onClick={linkEvent(
                          this,
                          this.handleCancelLeaveModTeamClick
                        )}
                      >
                        {i18n.t("no")}
                      </button>
                    </li>
                  </>
                ))}
              {amTopMod(Some(this.props.moderators)) && (
                <li className="list-inline-item-action">
                  <button
                    className="btn btn-link text-muted d-inline-block"
                    onClick={linkEvent(this, this.handleDeleteClick)}
                    data-tippy-content={
                      !community_view.community.deleted
                        ? i18n.t("delete")
                        : i18n.t("restore")
                    }
                    aria-label={
                      !community_view.community.deleted
                        ? i18n.t("delete")
                        : i18n.t("restore")
                    }
                  >
                    <Icon
                      icon="trash"
                      classes={`icon-inline ${
                        community_view.community.deleted && "text-danger"
                      }`}
                    />
                  </button>
                </li>
              )}
            </>
          )}
          {amAdmin(Some(this.props.admins)) && (
            <li className="list-inline-item">
              {!this.props.community_view.community.removed ? (
                <button
                  className="btn btn-link text-muted d-inline-block"
                  onClick={linkEvent(this, this.handleModRemoveShow)}
                >
                  {i18n.t("remove")}
                </button>
              ) : (
                <button
                  className="btn btn-link text-muted d-inline-block"
                  onClick={linkEvent(this, this.handleModRemoveSubmit)}
                >
                  {i18n.t("restore")}
                </button>
              )}
              <button
                className="btn btn-link text-muted d-inline-block"
                onClick={linkEvent(this, this.handlePurgeCommunityShow)}
                aria-label={i18n.t("purge_community")}
              >
                {i18n.t("purge_community")}
              </button>
            </li>
          )}
        </ul>
        {this.state.showRemoveDialog && (
          <form onSubmit={linkEvent(this, this.handleModRemoveSubmit)}>
            <div className="form-group">
              <label className="col-form-label" htmlFor="remove-reason">
                {i18n.t("reason")}
              </label>
              <input
                type="text"
                id="remove-reason"
                className="form-control mr-2"
                placeholder={i18n.t("optional")}
                value={toUndefined(this.state.removeReason)}
                onInput={linkEvent(this, this.handleModRemoveReasonChange)}
              />
            </div>
            {/* TODO hold off on expires for now */}
            {/* <div class="form-group row"> */}
            {/*   <label class="col-form-label">Expires</label> */}
            {/*   <input type="date" class="form-control mr-2" placeholder={i18n.t('expires')} value={this.state.removeExpires} onInput={linkEvent(this, this.handleModRemoveExpiresChange)} /> */}
            {/* </div> */}
            <div className="form-group">
              <button type="submit" className="btn btn-secondary">
                {i18n.t("remove_community")}
              </button>
            </div>
          </form>
        )}
        {this.state.showPurgeDialog && (
          <form onSubmit={linkEvent(this, this.handlePurgeSubmit)}>
            <div className="form-group">
              <PurgeWarning />
            </div>
            <div className="form-group">
              <label className="sr-only" htmlFor="purge-reason">
                {i18n.t("reason")}
              </label>
              <input
                type="text"
                id="purge-reason"
                className="form-control mr-2"
                placeholder={i18n.t("reason")}
                value={toUndefined(this.state.purgeReason)}
                onInput={linkEvent(this, this.handlePurgeReasonChange)}
              />
            </div>
            <div className="form-group">
              {this.state.purgeLoading ? (
                <Spinner />
              ) : (
                <button
                  type="submit"
                  className="btn btn-secondary"
                  aria-label={i18n.t("purge_community")}
                >
                  {i18n.t("purge_community")}
                </button>
              )}
            </div>
          </form>
        )}
      </>
    );
  }

  handleEditClick(i: Sidebar) {
    i.setState({ showEdit: true });
  }

  handleEditCommunity() {
    this.setState({ showEdit: false });
  }

  handleEditCancel() {
    this.setState({ showEdit: false });
  }

  handleDeleteClick(i: Sidebar, event: any) {
    event.preventDefault();
    let deleteForm = new DeleteCommunity({
      community_id: i.props.community_view.community.id,
      deleted: !i.props.community_view.community.deleted,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.deleteCommunity(deleteForm));
  }

  handleShowConfirmLeaveModTeamClick(i: Sidebar) {
    i.setState({ showConfirmLeaveModTeam: true });
  }

  handleLeaveModTeamClick(i: Sidebar) {
    UserService.Instance.myUserInfo.match({
      some: mui => {
        let form = new AddModToCommunity({
          person_id: mui.local_user_view.person.id,
          community_id: i.props.community_view.community.id,
          added: false,
          auth: auth().unwrap(),
        });
        WebSocketService.Instance.send(wsClient.addModToCommunity(form));
        i.setState({ showConfirmLeaveModTeam: false });
      },
      none: void 0,
    });
  }

  handleCancelLeaveModTeamClick(i: Sidebar) {
    i.setState({ showConfirmLeaveModTeam: false });
  }

  handleUnsubscribe(i: Sidebar, event: any) {
    event.preventDefault();
    let community_id = i.props.community_view.community.id;
    let form = new FollowCommunity({
      community_id,
      follow: false,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.followCommunity(form));

    // Update myUserInfo
    UserService.Instance.myUserInfo.match({
      some: mui =>
        (mui.follows = mui.follows.filter(i => i.community.id != community_id)),
      none: void 0,
    });
  }

  handleSubscribe(i: Sidebar, event: any) {
    event.preventDefault();
    let community_id = i.props.community_view.community.id;
    let form = new FollowCommunity({
      community_id,
      follow: true,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.followCommunity(form));

    // Update myUserInfo
    UserService.Instance.myUserInfo.match({
      some: mui =>
        mui.follows.push({
          community: i.props.community_view.community,
          follower: mui.local_user_view.person,
        }),
      none: void 0,
    });
  }

  get canPost(): boolean {
    return (
      !this.props.community_view.community.posting_restricted_to_mods ||
      amMod(Some(this.props.moderators)) ||
      amAdmin(Some(this.props.admins))
    );
  }

  handleModRemoveShow(i: Sidebar) {
    i.setState({ showRemoveDialog: true });
  }

  handleModRemoveReasonChange(i: Sidebar, event: any) {
    i.setState({ removeReason: Some(event.target.value) });
  }

  handleModRemoveExpiresChange(i: Sidebar, event: any) {
    i.setState({ removeExpires: Some(event.target.value) });
  }

  handleModRemoveSubmit(i: Sidebar, event: any) {
    event.preventDefault();
    let removeForm = new RemoveCommunity({
      community_id: i.props.community_view.community.id,
      removed: !i.props.community_view.community.removed,
      reason: i.state.removeReason,
      expires: i.state.removeExpires.map(getUnixTime),
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.removeCommunity(removeForm));

    i.setState({ showRemoveDialog: false });
  }

  handlePurgeCommunityShow(i: Sidebar) {
    i.setState({ showPurgeDialog: true, showRemoveDialog: false });
  }

  handlePurgeReasonChange(i: Sidebar, event: any) {
    i.setState({ purgeReason: Some(event.target.value) });
  }

  handlePurgeSubmit(i: Sidebar, event: any) {
    event.preventDefault();

    let form = new PurgeCommunity({
      community_id: i.props.community_view.community.id,
      reason: i.state.purgeReason,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.purgeCommunity(form));

    i.setState({ purgeLoading: true });
  }

  handleBlock(i: Sidebar, event: any) {
    event.preventDefault();
    let blockCommunityForm = new BlockCommunity({
      community_id: i.props.community_view.community.id,
      block: true,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.blockCommunity(blockCommunityForm));
  }

  handleUnblock(i: Sidebar, event: any) {
    event.preventDefault();
    let blockCommunityForm = new BlockCommunity({
      community_id: i.props.community_view.community.id,
      block: false,
      auth: auth().unwrap(),
    });
    WebSocketService.Instance.send(wsClient.blockCommunity(blockCommunityForm));
  }
}
