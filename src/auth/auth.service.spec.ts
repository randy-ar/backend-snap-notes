import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let supabaseService: any;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockAccessToken = 'access-token';
  const mockRefreshToken = 'refresh-token';
  const mockIdToken = 'google-id-token';

  const createMockPrismaService = () => ({
    pengguna: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  });

  const createMockSupabaseService = () => ({
    getClient: jest.fn(),
  });

  const createMockSupabaseClient = () => ({
    auth: {
      signInWithIdToken: jest.fn(),
    },
  });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockSupabase = createMockSupabaseService();
    const mockClient = createMockSupabaseClient();

    mockSupabase.getClient.mockReturnValue(mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabase,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    supabaseService = module.get(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('googleSignIn', () => {
    it('should successfully sign in with Google for existing user', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      const mockAuthData = {
        user: {
          id: mockUserId,
          email: mockEmail,
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
        },
      };

      const mockPengguna = {
        id: mockUserId,
        email: mockEmail,
        namaLengkap: 'Test User',
        fotoProfilUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      prismaService.pengguna.findUnique.mockResolvedValue(mockPengguna);

      const result = await service.googleSignIn(dto);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        userId: mockUserId,
        email: mockEmail,
      });

      expect(mockClient.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: mockIdToken,
      });

      expect(prismaService.pengguna.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });

      expect(prismaService.pengguna.create).not.toHaveBeenCalled();
    });

    it('should create new user when signing in with Google for the first time', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      const mockAuthData = {
        user: {
          id: mockUserId,
          email: mockEmail,
          user_metadata: {
            full_name: 'New User',
          },
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
        },
      };

      const mockNewPengguna = {
        id: mockUserId,
        email: mockEmail,
        namaLengkap: 'New User',
        fotoProfilUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      prismaService.pengguna.findUnique.mockResolvedValue(null);
      prismaService.pengguna.create.mockResolvedValue(mockNewPengguna);

      const result = await service.googleSignIn(dto);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        userId: mockUserId,
        email: mockEmail,
      });

      expect(prismaService.pengguna.create).toHaveBeenCalledWith({
        data: {
          id: mockUserId,
          email: mockEmail,
          namaLengkap: 'New User',
        },
      });
    });

    it('should use email prefix as name when user_metadata is not available', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      const mockAuthData = {
        user: {
          id: mockUserId,
          email: mockEmail,
          user_metadata: {},
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
        },
      };

      const mockNewPengguna = {
        id: mockUserId,
        email: mockEmail,
        namaLengkap: 'test',
        fotoProfilUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      prismaService.pengguna.findUnique.mockResolvedValue(null);
      prismaService.pengguna.create.mockResolvedValue(mockNewPengguna);

      await service.googleSignIn(dto);

      expect(prismaService.pengguna.create).toHaveBeenCalledWith({
        data: {
          id: mockUserId,
          email: mockEmail,
          namaLengkap: 'test',
        },
      });
    });

    it('should use default name when email and user_metadata are not available', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      const mockAuthData = {
        user: {
          id: mockUserId,
          email: mockEmail,
          user_metadata: {},
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
        },
      };

      const mockNewPengguna = {
        id: mockUserId,
        email: mockEmail,
        namaLengkap: 'Pengguna',
        fotoProfilUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      prismaService.pengguna.findUnique.mockResolvedValue(null);
      prismaService.pengguna.create.mockResolvedValue(mockNewPengguna);

      await service.googleSignIn(dto);

      expect(prismaService.pengguna.create).toHaveBeenCalledWith({
        data: {
          id: mockUserId,
          email: mockEmail,
          namaLengkap: 'Pengguna',
        },
      });
    });

    it('should throw UnauthorizedException when Google ID token is invalid', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: null,
        error: { message: 'Invalid token' },
      });

      await expect(service.googleSignIn(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.googleSignIn(dto)).rejects.toThrow('Google ID token tidak valid atau gagal membuat sesi');
    });

    it('should throw UnauthorizedException when auth returns error without user', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      await expect(service.googleSignIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when auth returns error without session', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: { user: { id: mockUserId }, session: null },
        error: null,
      });

      await expect(service.googleSignIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email is not available from Google', async () => {
      const dto = { idToken: mockIdToken };
      const mockClient = supabaseService.getClient();

      const mockAuthData = {
        user: {
          id: mockUserId,
          email: null,
        },
        session: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
        },
      };

      mockClient.auth.signInWithIdToken.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      await expect(service.googleSignIn(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.googleSignIn(dto)).rejects.toThrow('Email tidak tersedia dari Google account');
    });
  });
});
